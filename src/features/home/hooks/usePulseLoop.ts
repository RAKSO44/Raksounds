import { useCallback, useEffect, useRef, useState } from 'react';

import { PulseLoop } from '@/domain/audio/IMetronome';
import { isAccent } from '@/domain/lessons';
// Punto de composición con el motor real del metrónomo.
import { metronome } from '@/infrastructure/audio/metronome';
import { hapticPressIn } from '@/shared/haptics';

/** El último golpe que sonó. */
export interface HeardBeat {
  /** Cuántos golpes sonaron: cambia en cada uno, para animar aunque se repita todo lo demás. */
  count: number;
  accent: boolean;
}

export interface PulseLoopControls {
  /** false hasta que el metrónomo termina de cargar. */
  ready: boolean;
  running: boolean;
  beat: HeardBeat;
  /** Arranca el pulso o lo detiene (el corazón es un interruptor). */
  toggle: () => void;
}

/**
 * El pulso continuo del corazón de la teoría: suena sin fin hasta volver a
 * tocarlo, cambia de tempo en vivo cuando cambia `bpm` y, con cada golpe que
 * suena, da un golpe seco de háptica. Salir de la página lo corta.
 */
export function usePulseLoop(bpm: number): PulseLoopControls {
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState<HeardBeat>({ count: 0, accent: false });
  const loop = useRef<PulseLoop | null>(null);
  const bpmRef = useRef(bpm);

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

  const toggle = useCallback(() => {
    if (loop.current !== null) {
      loop.current.stop();
      loop.current = null;
      setRunning(false);
      return;
    }
    loop.current = metronome.loop({
      bpm: bpmRef.current,
      isAccent: (index) => isAccent(index),
      onBeat: ({ accent }) => {
        hapticPressIn();
        setBeat((previous) => ({ count: previous.count + 1, accent }));
      },
    });
    setRunning(loop.current !== null);
  }, []);

  // Al salir de la página no queda un pulso sonando de fondo.
  useEffect(
    () => () => {
      loop.current?.stop();
      loop.current = null;
    },
    [],
  );

  return { ready, running, beat, toggle };
}
