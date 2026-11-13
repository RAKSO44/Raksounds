/**
 * Una "toma": lo que el micrófono escuchó desde que el usuario tocó el botón
 * hasta que dejó de cantar. Aquí se decide CUÁNDO terminó la toma y QUÉ altura
 * cantó, a partir de los cuadros que entrega la detección de altura.
 *
 * Es puro: la pantalla le pasa la lista de cuadros y obtiene un estado. Así las
 * reglas (cuánto silencio cierra la toma, cuánto hay que cantar como mínimo) se
 * prueban sin micrófono.
 */

export interface PitchFrame {
  /** Momento en que TERMINA el cuadro, en ms desde el inicio de la toma. */
  readonly timeMs: number;
  /** Duración del cuadro en ms. */
  readonly durationMs: number;
  /** Altura MIDI continua detectada, o `null` si el cuadro es silencio/ruido. */
  readonly midi: number | null;
}

export const TAKE_RULES = {
  /**
   * Al abrir el micrófono se trata como silencio lo que llegue en este tiempo:
   * es la cola del piano que acaba de soltarse, no la voz del usuario. Lo
   * aplica quien construye los cuadros (ver `useSingingTake`).
   */
  warmupMs: 250,
  /**
   * Se ignora el arranque de la voz: el ataque de una nota cantada casi nunca
   * está afinado (se "entra" deslizando) y no es lo que se quiere medir.
   */
  onsetSkipMs: 200,
  /** Voz mínima para que la toma cuente; menos es una tos o un golpe. */
  minVoicedMs: 400,
  /** Silencio tras cantar que cierra la toma sola. */
  endSilenceMs: 700,
  /** Duración máxima: pasada, la toma se cierra aunque se siga cantando. */
  maxDurationMs: 6000,
  /** Si en este tiempo no se oyó nada, se abandona la toma. */
  noVoiceTimeoutMs: 5000,
} as const;

/**
 * - `waiting`: escuchando, aún sin voz.
 * - `singing`: hay voz y la toma sigue abierta.
 * - `finished`: la toma terminó con voz suficiente para calificarla.
 * - `silent`: la toma terminó sin voz suficiente (no hay nada que calificar).
 */
export type TakeState = 'waiting' | 'singing' | 'finished' | 'silent';

function voicedMs(frames: readonly PitchFrame[]): number {
  return frames.reduce((total, frame) => total + (frame.midi === null ? 0 : frame.durationMs), 0);
}

export function takeState(frames: readonly PitchFrame[]): TakeState {
  if (frames.length === 0) return 'waiting';

  const elapsed = frames[frames.length - 1].timeMs;
  const voiced = voicedMs(frames);
  const enoughVoice = voiced >= TAKE_RULES.minVoicedMs;

  if (voiced === 0) return elapsed >= TAKE_RULES.noVoiceTimeoutMs ? 'silent' : 'waiting';
  if (elapsed >= TAKE_RULES.maxDurationMs) return enoughVoice ? 'finished' : 'silent';

  const lastVoiced = [...frames].reverse().find((frame) => frame.midi !== null);
  const trailingSilence = lastVoiced === undefined ? elapsed : elapsed - lastVoiced.timeMs;
  if (trailingSilence >= TAKE_RULES.endSilenceMs) return enoughVoice ? 'finished' : 'silent';

  return 'singing';
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Cuadros con voz mínimos tras descartar el ataque. */
const MIN_PITCH_FRAMES = 3;

/**
 * Altura cantada en la toma (MIDI continuo), o `null` si no hay voz suficiente.
 *
 * Es la MEDIANA de los cuadros con voz, sin el ataque: un cuadro suelto que el
 * detector confunda con la octava, o el deslizamiento de entrada, no mueven la
 * mediana, mientras que una media se los tragaría.
 */
export function takePitch(frames: readonly PitchFrame[]): number | null {
  const firstVoiced = frames.find((frame) => frame.midi !== null);
  if (firstVoiced === undefined) return null;

  const onsetEnd = firstVoiced.timeMs - firstVoiced.durationMs + TAKE_RULES.onsetSkipMs;
  const pitches = frames
    .filter((frame) => frame.timeMs > onsetEnd)
    .map((frame) => frame.midi)
    .filter((midi): midi is number => midi !== null);

  return pitches.length < MIN_PITCH_FRAMES ? null : median(pitches);
}
