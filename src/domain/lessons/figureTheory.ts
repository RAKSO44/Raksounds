import { figureBeats, figureById, figureDurationMs, FigureId, RhythmFigure } from '../rhythm';
import { Clip, ClipNote } from './clip';
import { beatIntervalMs } from './tempo';

/**
 * Datos del Módulo 3 (figuras musicales).
 *
 * Tempo de TODO lo que suena en el módulo, con la negra como un pulso. A 72
 * BPM la semicorchea dura ~208 ms (cuatro por pulso, sin sonar atropelladas)
 * y la redonda ~3,3 s (se oye entera sin hacerse eterna). Va por su cuenta
 * del pulso del Módulo 2 (80 BPM): a 80 las semicorcheas sonaban apuradas.
 */
export const FIGURE_DEMO_BPM = 72;

/** DO central: la misma altura para todas, porque lo que cambia es la duración. */
export const FIGURE_DEMO_MIDI = 60;

export function figureClip(figure: RhythmFigure, bpm: number = FIGURE_DEMO_BPM): Clip {
  return rhythmClip([figure.id], { bpm });
}

export interface RhythmClipOptions {
  bpm?: number;
  /**
   * El pulso suena de fondo mientras duran las notas (un golpe por negra,
   * desde la primera nota). Es lo que da la referencia: "una negra = un
   * pulso".
   */
  pulse?: boolean;
}

/**
 * Figuras seguidas, cada una sonando EXACTAMENTE lo que vale (una semicorchea
 * a 72 BPM, ~208 ms; una redonda, ~3,3 s), una pegada a la otra: lo que se
 * oye entre dos notas es el ataque de la siguiente, nunca un silencio.
 */
export function rhythmClip(
  figures: readonly FigureId[],
  { bpm = FIGURE_DEMO_BPM, pulse = false }: RhythmClipOptions = {},
): Clip {
  let atMs = 0;
  const notes = figures.map((id) => {
    const durationMs = figureDurationMs(figureById(id), bpm);
    const note = { midi: FIGURE_DEMO_MIDI, atMs, durationMs };
    atMs += durationMs;
    return note;
  });
  return pulse
    ? { kind: 'rhythm', notes, pulseOnsetsMs: pulseOnsetsWithin(atMs, bpm) }
    : { kind: 'rhythm', notes };
}

/**
 * Golpes de un pulso que empieza con la primera nota y dura `totalMs`: uno
 * por pulso, mientras quede algo sonando. Una corchea sola lleva uno.
 */
export function pulseOnsetsWithin(totalMs: number, bpm: number): number[] {
  const interval = beatIntervalMs(bpm);
  const onsets: number[] = [];
  // Medio milisegundo de margen: 4 pulsos de una redonda no deben dar un quinto.
  for (let at = 0; at < totalMs - 0.5; at += interval) onsets.push(at);
  return onsets;
}

/**
 * Las notas que la figura `figure` toca en el pulso número `beat` (desde 0)
 * de un pulso continuo, contando la negra como un pulso, en ms desde ese
 * pulso:
 * - Más corta que la negra: llena el pulso (2 corcheas, 4 semicorcheas).
 * - Más larga: empieza solo en los pulsos donde cabe entera (la blanca en
 *   los pares, la redonda cada cuatro, con el pulso fuerte) y dura varios.
 */
export function figureNotesInBeat(figure: FigureId, beat: number, bpm: number): ClipNote[] {
  const beats = figureBeats(figureById(figure));
  const interval = beatIntervalMs(bpm);
  const durationMs = beats * interval;
  if (beats >= 1) {
    return beat % beats === 0 ? [{ midi: FIGURE_DEMO_MIDI, atMs: 0, durationMs }] : [];
  }
  return Array.from({ length: Math.round(1 / beats) }, (_, index) => ({
    midi: FIGURE_DEMO_MIDI,
    atMs: index * durationMs,
    durationMs,
  }));
}

/**
 * Lo que admite la barra de "¡Experimenta un poco!": una redonda. Con más, la
 * semicorchea tendría tan poco ancho en un teléfono que no se podría dibujar.
 */
export const PLAYGROUND_BAR_UNITS = figureById('whole').units;
