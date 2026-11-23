import { useCallback, useEffect, useRef, useState } from 'react';

import { AudioTimeMs, NO_VOICE, VoiceHandle } from '@/domain/audio';
import { beatIntervalMs, FIGURE_DEMO_BPM, figureNotesInBeat } from '@/domain/lessons';
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

/** Un golpe ya programado: cuándo suena, sus voces (para poder cortarlas) y lo que se dibuja. */
interface ScheduledBeat {
  atMs: AudioTimeMs;
  voices: VoiceHandle[];
  figures: BeatFigure[];
}

/** Golpes que una nota puede seguir sonando: la redonda dura cuatro. */
const LONGEST_BEATS = figureBeats(figureById('whole'));

/**
 * El pulso con una figura sonando encima: "un pulso = una negra". Cada vez
 * que el metrónomo programa un golpe, se programan en el piano las notas de
 * ese golpe (`figureNotesInBeat`: 2 corcheas o 4 semicorcheas por pulso, una
 * negra en cada uno, la blanca cada dos y la redonda cada cuatro, con el
 * fuerte) en el instante EXACTO del golpe, en el reloj de audio que comparten.
 * Nada pasa por `performance.now()`: por eso la figura suena con su golpe y
 * no unos ms antes o después, ni se va corriendo con los minutos.
 *
 * Las figuras se entregan con su golpe (`HeardBeat.figures`) para dibujarse
 * pegadas a su marca.
 *
 * Cambiar de figura no corta en seco lo que suena en este pulso: lo
 * programado para los siguientes se reprograma con la nueva, y una nota larga
 * que siga sonando se apaga justo en el próximo golpe.
 */
export function useFigurePulse(initial: FigureId | null = null): FigurePulse {
  const [figure, setFigure] = useState<FigureId | null>(initial);
  const figureRef = useRef(figure);
  const beats = useRef(new Map<number, ScheduledBeat>());
  /** El último golpe que sonó (-1: el pulso está parado o aún no sonó ninguno). */
  const heard = useRef(-1);

  useEffect(() => {
    pianoPlayer.load();
  }, []);

  /** Programa en el piano las notas de la figura actual en el golpe `index`. */
  const fill = useCallback((index: number, beat: ScheduledBeat) => {
    const current = figureRef.current;
    if (current === null) return;
    for (const note of figureNotesInBeat(current, index, FIGURE_DEMO_BPM)) {
      const voice = pianoPlayer.playTimed(note.midi, beat.atMs + note.atMs, note.durationMs);
      if (voice !== NO_VOICE) beat.voices.push(voice);
      beat.figures.push({ figure: current, offsetMs: note.atMs });
    }
  }, []);

  const pulse = usePulseLoop(FIGURE_DEMO_BPM, {
    onSchedule: (index, atMs) => {
      const beat: ScheduledBeat = { atMs, voices: [], figures: [] };
      fill(index, beat);
      beats.current.set(index, beat);
    },
    onBeat: (index) => {
      heard.current = index;
      // Lo que ya terminó de sonar no hace falta guardarlo.
      beats.current.forEach((_, beat) => {
        if (beat <= index - LONGEST_BEATS) beats.current.delete(beat);
      });
      return beats.current.get(index)?.figures ?? [];
    },
    onStop: () => {
      beats.current.forEach((beat) => beat.voices.forEach((voice) => pianoPlayer.noteOff(voice)));
      beats.current.clear();
      heard.current = -1;
    },
  });

  const choose = useCallback(
    (next: FigureId | null) => {
      figureRef.current = next;
      setFigure(next);
      // El próximo golpe, en su instante exacto si ya está programado.
      const last = beats.current.get(heard.current);
      const boundary =
        beats.current.get(heard.current + 1)?.atMs ??
        (last === undefined ? undefined : last.atMs + beatIntervalMs(FIGURE_DEMO_BPM));
      beats.current.forEach((beat, index) => {
        if (index > heard.current) {
          // Aún no suena: se reprograma, en el mismo instante, con la nueva figura.
          beat.voices.forEach((voice) => pianoPlayer.noteOff(voice));
          beat.voices = [];
          beat.figures = [];
          fill(index, beat);
        } else if (boundary !== undefined) {
          // Ya sonó: termina su pulso y una nota larga calla en el próximo golpe.
          beat.voices.forEach((voice) => pianoPlayer.noteOff(voice, boundary));
        }
      });
    },
    [fill],
  );

  return { ...pulse, figure, choose };
}
