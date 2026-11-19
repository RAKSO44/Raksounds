import { RandomSource } from '../ear-training';

/**
 * Pulso y tempo (Módulo 2). El tempo se expresa en BPM: pulsos por minuto.
 */

/** Rango del slider de BPM de la teoría. */
export const BPM_RANGE = { min: 40, max: 200 } as const;

/** Tempo del corazón de la página "¿Qué es el pulso?". */
export const PULSE_DEMO_BPM = 80;

/** Tempo con el que arranca el slider de "¿Qué es el tempo?". */
export const TEMPO_START_BPM = 100;

/**
 * Golpes por compás de la demostración: el primero de cada grupo es el fuerte
 * ("algunos pulsos son más fuertes que otros").
 */
export const BEATS_PER_BAR = 4;

/** ¿Es fuerte (acentuado) el golpe `index` (desde 0)? */
export function isAccent(index: number, beatsPerBar: number = BEATS_PER_BAR): boolean {
  return index % beatsPerBar === 0;
}

/**
 * Indicaciones de tempo de las partituras, por el BPM desde el que empiezan.
 * Son zonas aproximadas (cada tradición las corta algo distinto): estas son
 * las que enseña la app.
 */
export const TEMPO_MARKINGS = [
  { name: 'Largo', fromBpm: BPM_RANGE.min },
  { name: 'Adagio', fromBpm: 60 },
  { name: 'Andante', fromBpm: 76 },
  { name: 'Moderato', fromBpm: 108 },
  { name: 'Allegro', fromBpm: 120 },
  { name: 'Presto', fromBpm: 168 },
] as const;

export type TempoMarking = (typeof TEMPO_MARKINGS)[number]['name'];

/** La indicación de tempo que corresponde a `bpm`. */
export function tempoMarking(bpm: number): TempoMarking {
  let marking: TempoMarking = TEMPO_MARKINGS[0].name;
  for (const zone of TEMPO_MARKINGS) {
    if (bpm >= zone.fromBpm) marking = zone.name;
  }
  return marking;
}

export function clampBpm(bpm: number): number {
  return Math.min(BPM_RANGE.max, Math.max(BPM_RANGE.min, bpm));
}

/** BPM entero en la posición `fraction` (0 = mínimo, 1 = máximo) del slider. */
export function bpmAtFraction(fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.round(BPM_RANGE.min + clamped * (BPM_RANGE.max - BPM_RANGE.min));
}

/** Posición (0–1) de `bpm` en el slider. */
export function bpmFraction(bpm: number): number {
  return (clampBpm(bpm) - BPM_RANGE.min) / (BPM_RANGE.max - BPM_RANGE.min);
}

/** Milisegundos entre dos pulsos. */
export function beatIntervalMs(bpm: number): number {
  return 60000 / bpm;
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

/** ¿Los golpes están separados por la misma distancia (con 1 ms de redondeo)? */
export function isRegular(onsetsMs: readonly number[]): boolean {
  if (onsetsMs.length < 3) return true;
  const first = onsetsMs[1] - onsetsMs[0];
  return onsetsMs.every((onset, index) => {
    if (index === 0) return true;
    return Math.abs(onset - onsetsMs[index - 1] - first) <= 1;
  });
}

/**
 * Escala de un metrónomo mecánico (Maelzel): de 40 BPM, con la pesa arriba
 * del todo, a 208 BPM, con la pesa junto al eje.
 */
export const METRONOME_SCALE = { min: 40, max: 208 } as const;

/**
 * Dónde va la pesa en el brazo para `bpm`: 0 = arriba (lento), 1 = abajo
 * (rápido). En un metrónomo real, subir la pesa alarga el péndulo y lo
 * hace ir más lento; el número de la escala se lee a su altura.
 */
export function metronomeWeightPosition(bpm: number): number {
  const { min, max } = METRONOME_SCALE;
  return Math.min(1, Math.max(0, (bpm - min) / (max - min)));
}
