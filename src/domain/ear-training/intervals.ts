import { Note, NoteName, spellFromRoot } from '../music-theory';

/**
 * Catálogo de intervalos del entrenamiento auditivo.
 *
 * Un intervalo tiene DOS coordenadas, igual que una nota tiene altura y
 * deletreo:
 * - `semitones`: lo que suena (una 4ª aumentada y una 5ª disminuida son el
 *   mismo sonido).
 * - `number` + `quality`: cómo se llama y cómo se escribe. El número dice
 *   cuántas letras avanza el deletreo (una 3ª avanza 2 letras), así que de aquí
 *   sale que E♭ + 3ª menor sea G♭ y no F♯.
 *
 * Solo se listan los intervalos ascendentes dentro de la octava que usan los
 * niveles; el unísono queda fuera a propósito (no hay nada que identificar).
 */

export type IntervalId =
  'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export type IntervalQuality = 'perfect' | 'major' | 'minor' | 'augmented';

export interface Interval {
  readonly id: IntervalId;
  /** Distancia en semitonos desde la nota base. */
  readonly semitones: number;
  /** Número diatónico: 2 = segunda, 5 = quinta, 8 = octava. */
  readonly number: number;
  readonly quality: IntervalQuality;
}

export const INTERVALS: Record<IntervalId, Interval> = {
  m2: { id: 'm2', semitones: 1, number: 2, quality: 'minor' },
  M2: { id: 'M2', semitones: 2, number: 2, quality: 'major' },
  m3: { id: 'm3', semitones: 3, number: 3, quality: 'minor' },
  M3: { id: 'M3', semitones: 4, number: 3, quality: 'major' },
  P4: { id: 'P4', semitones: 5, number: 4, quality: 'perfect' },
  // El tritono se nombra como 4ª aumentada (su enarmonía es la 5ª disminuida).
  TT: { id: 'TT', semitones: 6, number: 4, quality: 'augmented' },
  P5: { id: 'P5', semitones: 7, number: 5, quality: 'perfect' },
  m6: { id: 'm6', semitones: 8, number: 6, quality: 'minor' },
  M6: { id: 'M6', semitones: 9, number: 6, quality: 'major' },
  m7: { id: 'm7', semitones: 10, number: 7, quality: 'minor' },
  M7: { id: 'M7', semitones: 11, number: 7, quality: 'major' },
  P8: { id: 'P8', semitones: 12, number: 8, quality: 'perfect' },
};

/** Ordenados de menor a mayor distancia (orden estable para listados). */
export const ALL_INTERVAL_IDS: readonly IntervalId[] = [
  'm2',
  'M2',
  'm3',
  'M3',
  'P4',
  'TT',
  'P5',
  'm6',
  'M6',
  'm7',
  'M7',
  'P8',
];

/** Semitonos de un intervalo (atajo del caso más frecuente). */
export function semitonesOf(id: IntervalId): number {
  return INTERVALS[id].semitones;
}

/**
 * Nota que resulta de subir un intervalo desde una tónica, con el deletreo
 * correcto: el número del intervalo fija cuántas letras avanza (una 6ª avanza
 * 5 letras) y la alteración se deduce de la altura.
 *
 * Devuelve `null` si el deletreo exigiera más de una doble alteración; con las
 * 12 tónicas de `CHROMATIC_ROOTS` eso no ocurre, pero el dominio no asume la
 * lista de tónicas que use la UI.
 */
export function noteAtInterval(root: NoteName, rootOctave: number, id: IntervalId): Note | null {
  const interval = INTERVALS[id];
  return spellFromRoot(root, rootOctave, interval.number - 1, interval.semitones);
}
