/**
 * Un "clip" es un estímulo con tiempo: lo que suena (o destella) al pulsar un
 * botón de escuchar. Es DATO, no audio: la capa de infraestructura decide cómo
 * hacerlo sonar. Así el estímulo y su temporización salen de la misma instancia
 * del ejercicio y no de estados visuales independientes.
 */

export interface ClipNote {
  readonly midi: number;
  /** Momento de inicio, en ms desde que empieza el clip. */
  readonly atMs: number;
  readonly durationMs: number;
}

export type Clip =
  /** Notas de piano. */
  | { readonly kind: 'notes'; readonly notes: readonly ClipNote[] }
  /** Golpes de metrónomo, programados con precisión de muestra. */
  | { readonly kind: 'pulse'; readonly onsetsMs: readonly number[] }
  /** Los mismos golpes, pero solo como destello visual, sin sonido. */
  | { readonly kind: 'flash'; readonly onsetsMs: readonly number[] };

/** Duración de una nota de un clip melódico. */
export const CLIP_NOTE_MS = 650;
/** Separación entre el inicio de dos notas seguidas de un clip. */
export const CLIP_NOTE_GAP_MS = 800;

/** Notas una tras otra, a ritmo constante. */
export function melodyClip(midis: readonly number[], gapMs = CLIP_NOTE_GAP_MS): Clip {
  return {
    kind: 'notes',
    notes: midis.map((midi, index) => ({ midi, atMs: index * gapMs, durationMs: CLIP_NOTE_MS })),
  };
}

/** Instantes de cada evento del clip (inicio de nota o golpe), en orden. */
export function clipEventTimes(clip: Clip): number[] {
  return clip.kind === 'notes' ? clip.notes.map((note) => note.atMs) : [...clip.onsetsMs];
}

/** Cuándo termina el clip, en ms desde su inicio. */
export function clipDurationMs(clip: Clip): number {
  if (clip.kind === 'notes') {
    return Math.max(0, ...clip.notes.map((note) => note.atMs + note.durationMs));
  }
  // Un golpe es instantáneo: se deja un margen corto para que se oiga la cola.
  return Math.max(0, ...clip.onsetsMs) + PULSE_TAIL_MS;
}

/** Margen tras el último golpe antes de dar el clip por terminado. */
export const PULSE_TAIL_MS = 300;
