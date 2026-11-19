import { useCallback, useEffect, useRef, useState } from 'react';

import { PulseLoop } from '@/domain/audio/IMetronome';
import { isAccent } from '@/domain/lessons';
// Punto de composición con el motor real del metrónomo.
import { metronome } from '@/infrastructure/audio/metronome';

import { HeardBeat } from './usePulseLoop';

const SILENT: HeardBeat = { count: 0, accent: false };

export interface MetronomesControls {
  /** false hasta que el metrónomo termina de cargar. */
  ready: boolean;
  /** El que suena ahora, o `null` si todos están apagados. */
  active: string | null;
  /** El último golpe que sonó del activo. */
  beat: HeardBeat;
  /** Cuándo sonó el golpe 0 del activo (reloj de `performance.now()`), o `null`. */
  startMs: number | null;
  /** Enciende `id` a `bpm` (apagando el que sonara). */
  start: (id: string, bpm: number) => void;
  stop: () => void;
  /** Enciende `id` o, si ya sonaba, lo apaga. */
  toggle: (id: string, bpm: number) => void;
}

/**
 * Los metrónomos de un ejercicio: cada uno suena SIN FIN hasta que el usuario
 * lo apaga, y solo uno a la vez (encender otro apaga el anterior). El control
 * es del usuario: nada se corta solo, salvo al salir del ejercicio.
 */
export function useMetronomes(): MetronomesControls {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [beat, setBeat] = useState<HeardBeat>(SILENT);
  const [startMs, setStartMs] = useState<number | null>(null);
  const loop = useRef<PulseLoop | null>(null);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    metronome.load().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const stop = useCallback(() => {
    loop.current?.stop();
    loop.current = null;
    activeRef.current = null;
    setActive(null);
    setStartMs(null);
    setBeat(SILENT);
  }, []);

  const start = useCallback((id: string, bpm: number) => {
    loop.current?.stop();
    setBeat(SILENT);
    loop.current = metronome.loop({
      bpm,
      isAccent: (index) => isAccent(index),
      onBeat: ({ accent }) => setBeat((previous) => ({ count: previous.count + 1, accent })),
    });
    const started = loop.current !== null;
    activeRef.current = started ? id : null;
    setActive(started ? id : null);
    setStartMs(loop.current?.startMs ?? null);
  }, []);

  const toggle = useCallback(
    (id: string, bpm: number) => {
      if (activeRef.current === id) stop();
      else start(id, bpm);
    },
    [start, stop],
  );

  // Al salir del ejercicio no queda ningún metrónomo sonando.
  useEffect(
    () => () => {
      loop.current?.stop();
      loop.current = null;
    },
    [],
  );

  return { ready, active, beat, startMs, start, stop, toggle };
}
