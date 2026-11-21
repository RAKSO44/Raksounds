import { useCallback, useRef, useState } from 'react';
import { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import {
  emptyBar,
  figureAt,
  FigureId,
  insertFigure,
  insertionIndex,
  isFull,
  moveFigure,
  removeFigure,
  RhythmBar,
  swapFigures,
} from '@/domain/rhythm';
import { hapticError, hapticSuccess, hapticTap } from '@/shared/haptics';
import { controls, motion } from '@/shared/theme';

/** De dónde sale lo que se arrastra: la paleta (no se acaba) o la propia barra. */
export type DragSource =
  | { readonly kind: 'palette'; readonly figure: FigureId }
  | { readonly kind: 'bar'; readonly key: number };

/**
 * Estado y reglas de la barra de "¡Experimenta un poco!". Las reglas son las
 * del dominio (`domain/rhythm/rhythmBar.ts`); aquí se decide cómo se SIENTE
 * cada cosa: un golpe suave al colocar, mover o quitar, la confirmación al
 * llenarla y, si algo no cabe, la barra tiembla con la háptica de error.
 */
export function useBarPlayground(capacity: number) {
  const [bar, setBar] = useState<RhythmBar>(() => emptyBar(capacity));
  // Los gestos llaman desde fuera del render: leen siempre la barra actual.
  // Solo `commit` la cambia, y actualiza las dos a la vez.
  const current = useRef(bar);
  const shake = useSharedValue(0);

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
   * Suelta lo arrastrado en `position` (semicorcheas desde el inicio de la
   * barra), o fuera de ella con `null`: una figura de la paleta se descarta y
   * una colocada vuelve a su sitio.
   *
   * De la paleta, se inserta donde cae. Una colocada soltada sobre otra se
   * intercambia con ella; en el espacio libre, pasa al final.
   */
  const drop = useCallback(
    (source: DragSource, position: number | null) => {
      if (position === null) return;
      const now = current.current;
      if (source.kind === 'palette') {
        add(source.figure, insertionIndex(now, position));
        return;
      }
      const target = figureAt(now, position);
      if (target === null) commit(moveFigure(now, source.key, now.figures.length));
      else if (target.key !== source.key) commit(swapFigures(now, source.key, target.key));
    },
    [add, commit],
  );

  return { bar, shake, add, remove, drop };
}
