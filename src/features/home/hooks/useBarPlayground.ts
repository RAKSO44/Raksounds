import { useCallback, useRef, useState } from 'react';
import { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import {
  emptyBar,
  FigureId,
  fits,
  insertFigure,
  isFull,
  moveFigure,
  removeFigure,
  RhythmBar,
  stickyInsertionIndex,
} from '@/domain/rhythm';
import { hapticError, hapticSuccess, hapticTap, hapticTick } from '@/shared/haptics';
import { controls, motion } from '@/shared/theme';

/** De dónde sale lo que se arrastra: la paleta (no se acaba) o la propia barra. */
export type DragSource =
  | { readonly kind: 'palette'; readonly figure: FigureId }
  | { readonly kind: 'bar'; readonly key: number };

/**
 * Lo que el dedo tiene que pasar la mitad de una figura (en semicorcheas)
 * para que la vista previa cambie de sitio: con el dedo quieto en una
 * frontera, la barra no tiembla de un lado a otro.
 */
const PREVIEW_MARGIN = 0.5;

/** Lo arrastrado mostrado en su sitio, antes de soltarlo. */
interface Preview {
  readonly index: number;
  readonly bar: RhythmBar;
}

/** Sobre qué se calcula dónde cae: una figura colocada se quita primero. */
function baseOf(bar: RhythmBar, source: DragSource): RhythmBar {
  return source.kind === 'bar' ? removeFigure(bar, source.key) : bar;
}

/** La barra si lo arrastrado se suelta en `index`; `null` si no cabe. */
function placeAt(bar: RhythmBar, source: DragSource, index: number): RhythmBar | null {
  return source.kind === 'palette'
    ? insertFigure(bar, source.figure, index)
    : moveFigure(bar, source.key, index);
}

const sameOrder = (a: RhythmBar, b: RhythmBar) =>
  a.figures.length === b.figures.length &&
  a.figures.every((placed, index) => placed.key === b.figures[index].key);

/**
 * Estado y reglas de la barra de "¡Experimenta un poco!". Las reglas son las
 * del dominio (`domain/rhythm/rhythmBar.ts`); aquí se decide cómo se SIENTE
 * cada cosa: un golpe suave al colocar, mover o quitar, un tic cada vez que
 * lo arrastrado encaja en otro sitio, la confirmación al llenarla y, si algo
 * no cabe, la barra tiembla con la háptica de error.
 *
 * Mientras se arrastra cerca de la barra, `shown` ya la muestra como quedaría
 * (`hover`); soltar aplica exactamente eso, y lejos de ella no cambia nada.
 */
export function useBarPlayground(capacity: number) {
  const [bar, setBar] = useState<RhythmBar>(() => emptyBar(capacity));
  // Los gestos llaman desde fuera del render: leen siempre la barra actual.
  // Solo `commit` la cambia, y actualiza las dos a la vez.
  const current = useRef(bar);
  const [preview, setPreviewState] = useState<Preview | null>(null);
  const previewRef = useRef<Preview | null>(null);
  // Cerca de la barra con una figura que no cabe: soltarla la hace temblar.
  const nearMiss = useRef(false);
  const shake = useSharedValue(0);

  const setPreview = useCallback((next: Preview | null) => {
    previewRef.current = next;
    setPreviewState(next);
  }, []);

  const commit = useCallback((next: RhythmBar) => {
    const filled = isFull(next) && !isFull(current.current);
    current.current = next;
    setBar(next);
    if (filled) hapticSuccess();
    else hapticTap();
  }, []);

  const reject = useCallback(() => {
    hapticError();
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    shake.value = withSequence(
      withTiming(-controls.shakeDistance, { duration: motion.shake }),
      withTiming(controls.shakeDistance, { duration: motion.shake }),
      withTiming(-controls.shakeDistance / 2, { duration: motion.shake }),
      withTiming(0, { duration: motion.shake }),
    );
  }, [shake]);

  /** Pone una figura en `index` (al final si se omite), o tiembla si no cabe. */
  const add = useCallback(
    (figure: FigureId, index: number = current.current.figures.length) => {
      const next = insertFigure(current.current, figure, index);
      if (next === null) reject();
      else commit(next);
    },
    [commit, reject],
  );

  const remove = useCallback((key: number) => commit(removeFigure(current.current, key)), [commit]);

  /**
   * Lo arrastrado está sobre el punto `position` de la barra (semicorcheas
   * desde su inicio), o lejos de ella con `null`: muestra dónde caería, o
   * vuelve la barra a como estaba.
   */
  const hover = useCallback(
    (source: DragSource, position: number | null) => {
      const now = current.current;
      nearMiss.current =
        position !== null && source.kind === 'palette' && !fits(now, source.figure);
      if (position === null || nearMiss.current) {
        if (previewRef.current === null) return;
        // Se aleja: la barra vuelve a como estaba.
        setPreview(null);
        hapticTick();
        return;
      }
      const previous = previewRef.current?.index ?? null;
      const index = stickyInsertionIndex(baseOf(now, source), position, previous, PREVIEW_MARGIN);
      if (index === previous) return;
      const next = placeAt(now, source, index);
      setPreview(next === null ? null : { index, bar: next });
      // Encaja en un sitio nuevo y las demás se corren: se siente en el dedo.
      hapticTick();
    },
    [setPreview],
  );

  /** Suelta lo arrastrado: aplica la vista previa, si la había. */
  const drop = useCallback(
    (source: DragSource) => {
      const shown = previewRef.current;
      const missed = nearMiss.current;
      nearMiss.current = false;
      setPreview(null);
      if (shown === null) {
        if (missed) reject();
        return;
      }
      const next = placeAt(current.current, source, shown.index);
      if (next === null) reject();
      else if (!sameOrder(next, current.current)) commit(next);
      // Vuelve a su mismo sitio: no cambia nada, pero se siente que se soltó.
      else hapticTap();
    },
    [commit, reject, setPreview],
  );

  /** Qué figura es lo arrastrado (una colocada puede no existir ya). */
  const figureOf = useCallback(
    (source: DragSource): FigureId | null =>
      source.kind === 'palette'
        ? source.figure
        : (current.current.figures.find((placed) => placed.key === source.key)?.figure ?? null),
    [],
  );

  return {
    bar,
    /** La barra a dibujar: con lo arrastrado ya en su sitio, si está cerca. */
    shown: preview?.bar ?? bar,
    previewing: preview !== null,
    shake,
    add,
    remove,
    hover,
    drop,
    figureOf,
  };
}
