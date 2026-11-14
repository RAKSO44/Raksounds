/**
 * Detección de la altura de una voz cantada a partir de muestras PCM.
 *
 * Usa el algoritmo YIN (de Cheveigné y Kawahara, 2002), el estándar para voz
 * monofónica: en vez de buscar el pico del espectro —que en la voz suele ser un
 * armónico y no la fundamental, y da errores de octava— busca el PERÍODO de la
 * onda, comparando la señal con copias de sí misma desplazadas.
 *
 * Todo es puro y sin dependencias: recibe números y devuelve números, así que se
 * prueba en Jest con senoidales sintéticas.
 */

/** Rango de búsqueda. Cubre de un bajo profundo (~E2) a una soprano aguda (~C6). */
export const MIN_VOICE_FREQUENCY = 75;
export const MAX_VOICE_FREQUENCY = 1100;

/**
 * Umbral de la diferencia normalizada de YIN. Por debajo de él un retardo se
 * considera "periódico": 0.15 es el valor que recomienda el artículo para voz.
 */
const YIN_THRESHOLD = 0.15;

/**
 * Nivel RMS mínimo (≈ -40 dBFS) para considerar que hay voz. Por debajo se
 * trata como silencio aunque YIN encontrara un período: así el ruido de fondo
 * no produce alturas fantasma.
 */
export const VOICE_RMS_THRESHOLD = 0.01;

export interface PitchEstimate {
  /** Frecuencia fundamental en Hz. */
  readonly frequency: number;
  /** Confianza en [0, 1]: 1 es una onda perfectamente periódica. */
  readonly clarity: number;
}

/** Por encima de esta frecuencia de muestreo el bloque se diezma antes de analizarlo. */
const MAX_ANALYSIS_RATE = 24000;

function decimateByTwo(
  input: ArrayLike<number>,
  inputRate: number,
): { samples: Float64Array; sampleRate: number } {
  const samples = new Float64Array(Math.floor(input.length / 2));
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = (input[2 * i] + input[2 * i + 1]) / 2;
  }
  return { samples, sampleRate: inputRate / 2 };
}

/** Raíz cuadrática media de un bloque: su "volumen". */
export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * Altura fundamental de un bloque, o `null` si es silencio, ruido o el bloque es
 * demasiado corto para contener dos períodos del tono más grave buscado.
 */
export function detectPitch(input: ArrayLike<number>, inputRate: number): PitchEstimate | null {
  if (rms(input) < VOICE_RMS_THRESHOLD) return null;

  // YIN es cuadrático en el tamaño del bloque. Una voz no pasa de ~1.1 kHz, así
  // que a 44.1/48 kHz sobra resolución: se diezma a la mitad (promediando pares,
  // que de paso filtra lo más agudo) y el cálculo cuesta la cuarta parte.
  const { samples, sampleRate } =
    inputRate > MAX_ANALYSIS_RATE
      ? decimateByTwo(input, inputRate)
      : { samples: input, sampleRate: inputRate };

  const maxLag = Math.floor(sampleRate / MIN_VOICE_FREQUENCY);
  const minLag = Math.max(2, Math.floor(sampleRate / MAX_VOICE_FREQUENCY));
  // La ventana de comparación es lo que sobra tras reservar el retardo máximo.
  const window = samples.length - maxLag;
  if (window < maxLag) return null;

  // 1–2. Función diferencia y su media acumulada normalizada (CMND).
  const cmnd = new Float64Array(maxLag + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    let diff = 0;
    for (let i = 0; i < window; i += 1) {
      const delta = samples[i] - samples[i + lag];
      diff += delta * delta;
    }
    runningSum += diff;
    cmnd[lag] = runningSum === 0 ? 1 : (diff * lag) / runningSum;
  }

  // 3. Primer mínimo bajo el umbral: el período más corto que encaja, lo que
  //    evita confundir la fundamental con su octava grave.
  let bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if (cmnd[lag] < YIN_THRESHOLD) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag += 1;
      bestLag = lag;
      break;
    }
  }
  if (bestLag === -1) return null;

  // 4. Interpolación parabólica: afina el retardo entre muestras. Sin ella, a
  //    44.1 kHz un La4 tendría un error de varios cents solo por discretizar.
  let refinedLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const before = cmnd[bestLag - 1];
    const at = cmnd[bestLag];
    const after = cmnd[bestLag + 1];
    const denominator = before + after - 2 * at;
    if (denominator !== 0) refinedLag = bestLag + (before - after) / (2 * denominator);
  }

  return { frequency: sampleRate / refinedLag, clarity: 1 - cmnd[bestLag] };
}

/** Altura MIDI CONTINUA (con decimales: 69.5 es un cuarto de tono sobre La4). */
export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

/** Frecuencia de una altura MIDI (admite decimales). */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Rango de volumen (dBFS) que recorre el indicador: de un susurro a cantar fuerte. */
const LEVEL_FLOOR_DB = -50;
const LEVEL_CEILING_DB = -10;

/**
 * Volumen de un bloque en [0, 1] para pintarlo (las barras del micrófono). Va en
 * decibelios y no en RMS lineal porque el oído es logarítmico: en lineal, cantar
 * a media voz apenas movería las barras.
 */
export function normalizedLevel(rmsValue: number): number {
  if (rmsValue <= 0) return 0;
  const db = 20 * Math.log10(rmsValue);
  const level = (db - LEVEL_FLOOR_DB) / (LEVEL_CEILING_DB - LEVEL_FLOOR_DB);
  return Math.min(1, Math.max(0, level));
}
