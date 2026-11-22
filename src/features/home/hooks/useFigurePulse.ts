import { useCallback, useEffect, useRef, useState } from 'react';

import { NO_VOICE, VoiceHandle } from '@/domain/audio';
import { FIGURE_DEMO_BPM, figureNotesInBeat } from '@/domain/lessons';
import { figureBeats, figureById, FigureId } from '@/domain/rhythm';
// Punto de composición con el piano real (el pulso lo pone usePulseLoop).
import { pianoPlayer } from '@/infrastructure/audio/pianoPlayer';

import { BeatFigure, PulseLoopControls, usePulseLoop } from './usePulseLoop';

export interface FigurePulse extends PulseLoopControls {
  /** La figura que suena encima del pulso (`null`: solo el pulso). */
  figure: FigureId | null;
  /** Elige otra figura (o ninguna): entra en el siguiente pulso. */
  choose: (figure: FigureId | null) => void;
}

/** Lo programado para un golpe: sus voces (para poder cortarlas) y lo que se dibuja. */
interface ScheduledBeat {
  voices: VoiceHandle[];
  figures: BeatFigure[];
}

/** Golpes que una nota puede seguir sonando: la redonda dura cuatro. */
const LONGEST_BEATS = figureBeats(figureById('whole'));

/**
 * El pulso con una figura sonando encima, en el MISMO reloj: "un pulso = una
 * negra". Cada golpe programa las notas del siguiente (`figureNotesInBeat`):
 * 2 corcheas o 4 semicorcheas por pulso, una negra en cada uno, la blanca
 * cada dos y la redonda cada cuatro (con el fuerte). Las figuras se entregan
 * con su golpe (`HeardBeat.figures`) para dibujarse pegadas a su marca.
 *
 * Cambiar de figura no corta en seco lo que suena en este pulso: lo
 * programado para los siguientes se anula, una nota larga que siga sonando se
 * apaga justo en el próximo golpe, y desde ahí entra la nueva.
 */
export function useFigurePulse(initial: FigureId | null = null): FigurePulse {
  const [figure, setFigure] = useState<FigureId | null>(initial);
  const figureRef = useRef(figure);
  const clock = useRef<{ startMs: number; intervalMs: number } | null>(null);
  const beats = useRef(new Map<number, ScheduledBeat>());
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pianoPlayer.load();
  }, []);

  const cut = useCallback((which: (beat: number) => boolean) => {
    for (const [beat, scheduled] of beats.current) {
      if (!which(beat)) continue;
      scheduled.voices.forEach((voice) => pianoPlayer.noteOff(voice));
      beats.current.delete(beat);
    }
  }, []);

  const silence = useCallback(() => {
    if (cutTimer.current !== null) clearTimeout(cutTimer.current);
    cutTimer.current = null;
    cut(() => true);
  }, [cut]);

  /** Programa en el piano las notas de la figura en el golpe `beat`. */
  const schedule = useCallback((beat: number) => {
    const time = clock.current;
    const current = figureRef.current;
    if (time === null || current === null) return;
    const beatAt = time.startMs + beat * time.intervalMs;
    const scheduled: ScheduledBeat = { voices: [], figures: [] };
    for (const note of figureNotesInBeat(current, beat, FIGURE_DEMO_BPM)) {
      const delay = beatAt + note.atMs - performance.now();
      if (delay < 0) continue;
      const voice = pianoPlayer.playTimed(note.midi, delay, note.durationMs);
      if (voice !== NO_VOICE) scheduled.voices.push(voice);
      scheduled.figures.push({ figure: current, offsetMs: note.atMs });
    }
    beats.current.set(beat, scheduled);
  }, []);

  const pulse = usePulseLoop(FIGURE_DEMO_BPM, {
    onStart: (startMs, intervalMs) => {
      clock.current = { startMs, intervalMs };
      schedule(0);
    },
    onBeat: (index) => {
      const figures = beats.current.get(index)?.figures ?? [];
      // Lo que ya terminó de sonar no hace falta guardarlo.
      beats.current.forEach((_, beat) => {
        if (beat <= index - LONGEST_BEATS) beats.current.delete(beat);
      });
      schedule(index + 1);
      return figures;
    },
    onStop: () => {
      clock.current = null;
      silence();
    },
  });

  const choose = useCallback(
    (next: FigureId | null) => {
      figureRef.current = next;
      setFigure(next);
      const time = clock.current;
      if (time === null) return;
      const nextBeat = Math.floor((performance.now() - time.startMs) / time.intervalMs) + 1;
      // Lo de los próximos golpes aún no suena: se anula.
      cut((beat) => beat >= nextBeat);
      // Lo que suena ahora termina su pulso; una nota larga se apaga en el próximo golpe.
      if (cutTimer.current !== null) clearTimeout(cutTimer.current);
      cutTimer.current = setTimeout(
        () => {
          cutTimer.current = null;
          cut((beat) => beat < nextBeat);
        },
        Math.max(0, time.startMs + nextBeat * time.intervalMs - performance.now()),
      );
      schedule(nextBeat);
    },
    [cut, schedule],
  );

  return { ...pulse, figure, choose };
}
