import { Clip, melodyClip } from './clip';

/**
 * Los siete nombres de nota (Módulo 1). Aquí "nota" es un NOMBRE que se repite
 * en ciclo; la altura real la da una octava concreta. Separarlo es lo que
 * permite enseñar que dos DO distintos se llaman igual.
 */

export const NOTE_NAMES = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'] as const;

export type NoteNameEs = (typeof NOTE_NAMES)[number];

/** Posición 0–6 de un nombre en el ciclo DO…SI. */
export type NoteIndex = number;

export const NOTE_COUNT = NOTE_NAMES.length;

/**
 * El cifrado: la misma nota nombrada con una letra (sistema anglosajón), en el
 * mismo orden que `NOTE_NAMES`. DO = C, RE = D… SI = B.
 */
export const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Semitonos de cada nombre desde DO: las notas naturales (escala de Do mayor). */
const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;

/**
 * Octava por defecto de los ejemplos: DO4–SI4. El banco de muestras va de C4 a
 * C6, así que hay sitio para un DO5 y un DO6 cuando se compara la octava.
 */
export const BASE_OCTAVE = 4;

/** Índice dentro del ciclo, admitiendo valores fuera de 0–6 (da la vuelta). */
export function wrapIndex(index: number): NoteIndex {
  return ((index % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
}

export function noteNameAt(index: number): NoteNameEs {
  return NOTE_NAMES[wrapIndex(index)];
}

export function noteLetterAt(index: number): (typeof NOTE_LETTERS)[number] {
  return NOTE_LETTERS[wrapIndex(index)];
}

/** La nota que sigue a `index` subiendo: después de SI vuelve DO. */
export function nextNoteIndex(index: NoteIndex): NoteIndex {
  return wrapIndex(index + 1);
}

/** La nota anterior (bajando): antes de DO viene SI. */
export function previousNoteIndex(index: NoteIndex): NoteIndex {
  return wrapIndex(index - 1);
}

/**
 * Tramo de `length` nombres consecutivos desde `start`, subiendo o bajando. Da
 * la vuelta al ciclo si hace falta (LA, SI, DO, RE…).
 */
export function noteRun(
  start: NoteIndex,
  length: number,
  direction: 'up' | 'down' = 'up',
): NoteIndex[] {
  const step = direction === 'up' ? 1 : -1;
  return Array.from({ length }, (_, offset) => wrapIndex(start + offset * step));
}

/** Altura MIDI de un nombre en una octava (DO4 = 60). */
export function noteMidi(index: NoteIndex, octave = BASE_OCTAVE): number {
  return 12 * (octave + 1) + NATURAL_SEMITONES[wrapIndex(index)];
}

/**
 * Alturas MIDI de un tramo que SUBE o BAJA de verdad: al dar la vuelta (SI→DO
 * subiendo) cambia de octava en vez de saltar hacia atrás.
 */
export function runMidis(
  start: NoteIndex,
  length: number,
  direction: 'up' | 'down' = 'up',
  octave = BASE_OCTAVE,
): number[] {
  const step = direction === 'up' ? 1 : -1;
  return Array.from({ length }, (_, offset) => {
    const absolute = start + offset * step;
    const octaveShift = Math.floor(absolute / NOTE_COUNT);
    return noteMidi(wrapIndex(absolute), octave + octaveShift);
  });
}

/** Clip de una sola nota. */
export function noteClip(index: NoteIndex, octave = BASE_OCTAVE): Clip {
  return melodyClip([noteMidi(index, octave)]);
}
