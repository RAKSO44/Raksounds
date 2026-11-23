import { useCallback, useEffect, useRef, useState } from 'react';

import { AudioTimeMs, PulseLoop } from '@/domain/audio';
import { isAccent } from '@/domain/lessons';
import { FigureId } from '@/domain/rhythm';
// Punto de composición con el motor real del metrónomo.
import { metronome } from '@/infrastructure/audio/metronome';
import { hapticPressIn } from '@/shared/haptics';

/** Una figura que suena dentro de un golpe, `offsetMs` después de él. */
export interface BeatFigure {
  figure: FigureId;
  offsetMs: number;
}

/** El último golpe que sonó. */
export interface HeardBeat {
  /** Cuántos golpes sonaron: cambia en cada uno, para animar aunque se repita todo lo demás. */
  count: number;
  accent: boolean;
  /**
   * Las figuras que suenan en este golpe (Módulo 3). Viajan CON su golpe:
   * así la figura y su marca roja no pueden desalinearse.
   */
  figures?: readonly BeatFigure[];
  /** Cuándo sonó (reloj de `performance.now()`). */
  atMs?: number;
}

export interface PulseLoopControls {
  /** false hasta que el metrónomo termina de cargar. */
  ready: boolean;
  running: boolean;
  beat: HeardBeat;
  /** Arranca el pulso o lo detiene (el corazón es un interruptor). */
  toggle: () => void;
  /** Lo detiene si sonaba (otro corazón de la misma hoja va a arrancar). */
  stop: () => void;
}

/** Para sonar algo encima del pulso, en su mismo reloj. */
export interface PulseLoopListener {
  /**
   * Se acaba de programar el golpe `index` (desde 0): suena en `atMs`, del
   * reloj de audio que comparten el metrónomo y el piano. Lo que se programe
   * aquí en ese reloj suena exactamente con él.
   */
  onSchedule?: (index: number, atMs: AudioTimeMs) => void;
  /** Sonó el golpe `index`. Devuelve las figuras que suenan en él, si las hay. */
  onBeat?: (index: number) => readonly BeatFigure[] | void;
  onStop?: () => void;
}

/**
 * El pulso continuo del corazón de la teoría: suena sin fin hasta volver a
 * tocarlo, cambia de tempo en vivo cuando cambia `bpm` y, con cada golpe que
 * suena, da un golpe seco de háptica. Salir de la página lo corta.
 */
export function usePulseLoop(bpm: number, listener?: PulseLoopListener): PulseLoopControls {
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState<HeardBeat>({ count: 0, accent: false });
  const loop = useRef<PulseLoop | null>(null);
  const bpmRef = useRef(bpm);
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });

  useEffect(() => {
    let mounted = true;
    metronome.load().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    bpmRef.current = bpm;
    loop.current?.setBpm(bpm);
  }, [bpm]);

  const stop = useCallback(() => {
    if (loop.current === null) return;
    loop.current.stop();
    loop.current = null;
    setRunning(false);
    listenerRef.current?.onStop?.();
  }, []);

  const toggle = useCallback(() => {
    if (loop.current !== null) {
      stop();
      return;
    }
    loop.current = metronome.loop({
      bpm: bpmRef.current,
      isAccent: (index) => isAccent(index),
      onSchedule: ({ index, atMs }) => listenerRef.current?.onSchedule?.(index, atMs),
      onBeat: ({ index, accent }) => {
        hapticPressIn();
        const figures = listenerRef.current?.onBeat?.(index) ?? undefined;
        const atMs = performance.now();
        setBeat((previous) => ({ count: previous.count + 1, accent, figures, atMs }));
      },
    });
    setRunning(loop.current !== null);
  }, [stop]);

  // Al salir de la página no queda un pulso sonando de fondo.
  useEffect(
    () => () => {
      loop.current?.stop();
      loop.current = null;
      listenerRef.current?.onStop?.();
    },
    [],
  );

  return { ready, running, beat, toggle, stop };
}
