/**
 * Modelo de notas con dos conceptos separados:
 *
 * 1. ALTURA (pitch): qué frecuencia suena. Canónico: número MIDI (C4 = 60).
 *    Es lo único que le importa al audio.
 * 2. DELETREO (spelling): cómo se escribe la nota — letra + alteración.
 *    E♭ y D♯ son la misma altura pero distinto deletreo, y en una escala
 *    importa: E♭ mayor se escribe E♭ F G A♭ B♭ C D (cada letra una vez).
 */

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** Letras en orden diatónico, empezando en C (índice 0). */
export const NOTE_LETTERS: readonly NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Clase de altura (0–11) de cada letra natural, relativa a C. */
const NATURAL_PITCH_CLASS: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Alteración en semitonos: -2 = doble bemol … +2 = doble sostenido. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

/** Deletreo de una nota, sin octava: F♯, B♭, E𝄪… */
export interface NoteName {
  readonly letter: NoteLetter;
  readonly accidental: Accidental;
}

/**
 * Nota concreta en notación científica de altura (C4 = do central).
 * La octava pertenece a la LETRA, no al sonido: B♯3 suena como C4 (MIDI 60)
 * pero se escribe en la octava 3.
 */
export interface Note {
  readonly name: NoteName;
  readonly octave: number;
}

/** Clase de altura: 0 (C) … 11 (B). */
export type PitchClass = number;

/** Índice de una letra en el ciclo diatónico C=0 … B=6. */
export function letterIndex(letter: NoteLetter): number {
  return NOTE_LETTERS.indexOf(letter);
}

/** Clase de altura (0–11) de un deletreo. pitchClassOf({E,♭}) = 3. */
export function pitchClassOf(name: NoteName): PitchClass {
  return (((NATURAL_PITCH_CLASS[name.letter] + name.accidental) % 12) + 12) % 12;
}

/** Nota → número MIDI. noteToMidi(C4) = 60, noteToMidi(A4) = 69. */
export function noteToMidi(note: Note): number {
  return (note.octave + 1) * 12 + NATURAL_PITCH_CLASS[note.name.letter] + note.name.accidental;
}

/** Clase de altura de un número MIDI. */
export function midiPitchClass(midi: number): PitchClass {
  return ((midi % 12) + 12) % 12;
}

/** Octava (científica) de un número MIDI: midiOctave(60) = 4. */
export function midiOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Transposición en semitonos sobre la altura canónica. */
export function transpose(midi: number, semitones: number): number {
  return midi + semitones;
}

const ACCIDENTAL_SYMBOLS: Record<Accidental, string> = {
  [-2]: '♭♭',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '♯♯', // se duplica el símbolo en lugar de usar 𝄪 (U+1D12A) por soporte de fuentes en Android
};

/** "E♭", "F♯", "C"… */
export function formatNoteName(name: NoteName): string {
  return name.letter + ACCIDENTAL_SYMBOLS[name.accidental];
}

/** "E♭4", "F♯3"… */
export function formatNote(note: Note): string {
  return formatNoteName(note.name) + note.octave;
}

export type AccidentalPreference = 'sharp' | 'flat';

/** Deletreos con sostenidos por clase de altura (índice 0–11). */
const SHARP_SPELLINGS: readonly NoteName[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'C', accidental: 1 },
  { letter: 'D', accidental: 0 },
  { letter: 'D', accidental: 1 },
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'F', accidental: 1 },
  { letter: 'G', accidental: 0 },
  { letter: 'G', accidental: 1 },
  { letter: 'A', accidental: 0 },
  { letter: 'A', accidental: 1 },
  { letter: 'B', accidental: 0 },
];

/** Deletreos con bemoles por clase de altura (índice 0–11). */
const FLAT_SPELLINGS: readonly NoteName[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'D', accidental: -1 },
  { letter: 'D', accidental: 0 },
  { letter: 'E', accidental: -1 },
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'G', accidental: -1 },
  { letter: 'G', accidental: 0 },
  { letter: 'A', accidental: -1 },
  { letter: 'A', accidental: 0 },
  { letter: 'B', accidental: -1 },
  { letter: 'B', accidental: 0 },
];

/** Deletreo de una clase de altura según preferencia de alteración. */
export function spellPitchClass(
  pitchClass: PitchClass,
  preference: AccidentalPreference,
): NoteName {
  const spellings = preference === 'sharp' ? SHARP_SPELLINGS : FLAT_SPELLINGS;
  return spellings[((pitchClass % 12) + 12) % 12];
}

/**
 * Las 12 notas base que ofrece la UI, con el deletreo convencional de cada
 * tonalidad: sostenidos para C♯/F♯, bemoles para E♭/A♭/B♭ (las armaduras
 * más comunes en la práctica).
 */
export const CHROMATIC_ROOTS: readonly NoteName[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'C', accidental: 1 },
  { letter: 'D', accidental: 0 },
  { letter: 'E', accidental: -1 },
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'F', accidental: 1 },
  { letter: 'G', accidental: 0 },
  { letter: 'A', accidental: -1 },
  { letter: 'A', accidental: 0 },
  { letter: 'B', accidental: -1 },
  { letter: 'B', accidental: 0 },
];
