import { figureById, figureDurationMs, RhythmFigure } from '../rhythm';
import { Clip } from './clip';
import { PULSE_DEMO_BPM } from './tempo';

/**
 * Datos de la teoría del Módulo 3 (figuras musicales).
 *
 * Cómo suena una figura en la teoría del Módulo 3: una nota de piano que dura
 * lo que la figura al pulso del Módulo 2 (la negra, un pulso). Así la blanca
 * se OYE el doble de larga que la negra.
 */
export const FIGURE_DEMO_BPM = PULSE_DEMO_BPM;

/** DO central: la misma altura para todas, porque lo que cambia es la duración. */
export const FIGURE_DEMO_MIDI = 60;

export function figureClip(figure: RhythmFigure, bpm: number = FIGURE_DEMO_BPM): Clip {
  return {
    kind: 'notes',
    notes: [{ midi: FIGURE_DEMO_MIDI, atMs: 0, durationMs: figureDurationMs(figure, bpm) }],
  };
}

/**
 * Lo que admite la barra de "¡Experimenta un poco!": una redonda. Con más, la
 * semicorchea tendría tan poco ancho en un teléfono que no se podría dibujar.
 */
export const PLAYGROUND_BAR_UNITS = figureById('whole').units;
