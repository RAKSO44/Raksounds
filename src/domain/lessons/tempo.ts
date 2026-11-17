import { RandomSource } from '../ear-training';
import { Clip } from './clip';

/**
 * Pulso y tempo (Módulo 2). El tempo se expresa en BPM: pulsos por minuto.
 */

/** Rango seguro del selector de BPM de la teoría. */
export const BPM_RANGE = { min: 40, max: 200 } as const;

/** Paso del selector +/- de BPM. */
export const BPM_STEP = 5;

/**
 * Los tres tempos de referencia que enseña la teoría. Lento, moderado y rápido
 * son zonas aproximadas, no valores exactos: se usan estos tres como ejemplo.
 */
export const TEMPO_PRESETS = [
  { id: 'slow', bpm: 60 },
  { id: 'moderate', bpm: 90 },
  { id: 'fast', bpm: 120 },
] as const;

export type TempoPresetId = (typeof TEMPO_PRESETS)[number]['id'];

/** Milisegundos entre dos pulsos. */
export function beatIntervalMs(bpm: number): number {
  return 60000 / bpm;
}

/** Pulsos que caben en un segundo ("60 BPM = 1 pulso por segundo"). */
export function pulsesPerSecond(bpm: number): number {
  return bpm / 60;
}

export function clampBpm(bpm: number): number {
  return Math.min(BPM_RANGE.max, Math.max(BPM_RANGE.min, bpm));
}

/** Instantes de `count` pulsos regulares, empezando en 0. */
export function regularOnsets(bpm: number, count: number): number[] {
  const interval = beatIntervalMs(bpm);
  return Array.from({ length: count }, (_, index) => Math.round(index * interval));
}

/**
 * Cuánto se desplaza, como mínimo y como máximo, cada golpe de un pulso
 * irregular respecto a su lugar regular (proporción del intervalo). El mínimo
 * garantiza que la irregularidad se oiga: un desvío de unos pocos ms pasaría
 * por regular y el ejercicio tendría dos respuestas correctas.
 */
const IRREGULAR_SHIFT = { min: 0.25, max: 0.4 } as const;

/**
 * Golpes con la misma cantidad y la misma duración media que un pulso regular,
 * pero desplazados de forma desigual: suena "a trompicones". El primero queda
 * en 0 y los desvíos alternan de signo para que nunca se crucen dos golpes.
 */
export function irregularOnsets(bpm: number, count: number, random: RandomSource): number[] {
  const interval = beatIntervalMs(bpm);
  return regularOnsets(bpm, count).map((onset, index) => {
    if (index === 0) return onset;
    const amount = IRREGULAR_SHIFT.min + random() * (IRREGULAR_SHIFT.max - IRREGULAR_SHIFT.min);
    const sign = index % 2 === 0 ? 1 : -1;
    return Math.round(onset + sign * amount * interval);
  });
}

export function pulseClip(bpm: number, count: number): Clip {
  return { kind: 'pulse', onsetsMs: regularOnsets(bpm, count) };
}

/** ¿Los golpes están separados por la misma distancia (con 1 ms de redondeo)? */
export function isRegular(onsetsMs: readonly number[]): boolean {
  if (onsetsMs.length < 3) return true;
  const first = onsetsMs[1] - onsetsMs[0];
  return onsetsMs.every((onset, index) => {
    if (index === 0) return true;
    return Math.abs(onset - onsetsMs[index - 1] - first) <= 1;
  });
}
