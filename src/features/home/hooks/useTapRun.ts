import { useCallback, useRef, useState } from 'react';

import { beatIntervalMs, judgeTaps, regularOnsets, TapJudgement } from '@/domain/lessons';

import { ClipPlayer } from './useClipPlayer';

export interface TapRunConfig {
  bpm: number;
  /** Golpes de entrada (se escuchan, no se califican). */
  countIn: number;
  /** Golpes que se califican. */
  beats: number;
}

export type TapRunPhase = 'idle' | 'running' | 'done' | 'failed';

export interface TapRun {
  phase: TapRunPhase;
  /** Último golpe que sonó (índice sobre entrada + calificados), o -1. */
  beat: number;
  /** Cuántas veces sonó un golpe: cambia aunque se repita el índice. */
  pulseCount: number;
  judgement: TapJudgement | null;
  start: () => void;
  tap: () => void;
}

/**
 * Una pasada de "toca al ritmo": hace sonar la entrada y los golpes, anota la
 * hora de cada toque y, al terminar, la califica el dominio (`judgeTaps`).
 * Golpes y toques se miden en el mismo reloj (`performance.now()`), y los
 * golpes con la referencia que devuelve el propio motor de audio.
 */
export function useTapRun(player: ClipPlayer, config: TapRunConfig): TapRun {
  const { bpm, countIn, beats } = config;
  const [phase, setPhase] = useState<TapRunPhase>('idle');
  const [beat, setBeat] = useState(-1);
  const [pulseCount, setPulseCount] = useState(0);
  const [judgement, setJudgement] = useState<TapJudgement | null>(null);
  const taps = useRef<number[]>([]);
  const running = useRef(false);

  const start = useCallback(() => {
    const onsets = regularOnsets(bpm, countIn + beats);
    taps.current = [];
    setJudgement(null);
    setBeat(-1);
    const reference = player.play(
      { kind: 'pulse', onsetsMs: onsets },
      {
        onEvent: (index) => {
          setBeat(index);
          setPulseCount((count) => count + 1);
        },
        onEnd: () => {
          running.current = false;
          const beatTimes = onsets.slice(countIn).map((onset) => reference! + onset);
          // Los toques durante la entrada (antes de medio pulso del primer
          // golpe calificado) son el usuario buscando el pulso: no cuentan.
          const firstScored = beatTimes[0] - beatIntervalMs(bpm) / 2;
          setJudgement(
            judgeTaps(
              beatTimes,
              taps.current.filter((time) => time >= firstScored),
            ),
          );
          setPhase('done');
          setBeat(-1);
        },
      },
    );
    if (reference === null) {
      // El audio no está listo: no se califica un pulso que no sonó.
      setPhase('failed');
      return;
    }
    running.current = true;
    setPhase('running');
  }, [player, bpm, countIn, beats]);

  const tap = useCallback(() => {
    if (running.current) taps.current.push(performance.now());
  }, []);

  return { phase, beat, pulseCount, judgement, start, tap };
}
