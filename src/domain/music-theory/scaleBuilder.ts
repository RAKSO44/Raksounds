import {
  Accidental,
  letterIndex,
  Note,
  NoteName,
  noteToMidi,
  NOTE_LETTERS,
} from './note';
import { ScaleFormula, SCALE_FORMULAS, ScaleType } from './scaleFormulas';

/** Un grado concreto de una escala/arpegio ya construido. */
export interface ScaleDegree {
  /** Deletreo y octava correctos para mostrar en la UI. */
  readonly note: Note;
  /** Altura canónica para el reproductor de audio. */
  readonly midi: number;
  /** Posición dentro de la fórmula (0 = tónica). */
  readonly degreeIndex: number;
}

export interface Scale {
  readonly root: Note;
  readonly type: ScaleType;
  readonly degrees: readonly ScaleDegree[];
}

/**
 * Construye una escala o arpegio a partir de la tónica.
 *
 * El deletreo de cada grado se deriva de la fórmula: la letra avanza según
 * `letterSteps` y la alteración es la diferencia entre la altura objetivo
 * (tónica + semitonos) y la nota natural de esa letra. Así cada tonalidad
 * queda deletreada correctamente (C♯ mayor produce E♯ y B♯; G♯ menor
 * melódica produce F♯♯) sin tablas por tonalidad.
 */
export function buildScale(root: NoteName, rootOctave: number, type: ScaleType): Scale {
  const formula: ScaleFormula = SCALE_FORMULAS[type];
  const rootNote: Note = { name: root, octave: rootOctave };
  const rootMidi = noteToMidi(rootNote);
  const rootLetterIndex = letterIndex(root.letter);

  const degrees: ScaleDegree[] = formula.semitones.map((semitones, degreeIndex) => {
    const absoluteLetterIndex = rootLetterIndex + formula.letterSteps[degreeIndex];
    const letter = NOTE_LETTERS[absoluteLetterIndex % 7];
    // La octava científica pertenece a la letra: sube cada vez que el ciclo
    // de letras pasa de B a C.
    const octave = rootOctave + Math.floor(absoluteLetterIndex / 7);

    const targetMidi = rootMidi + semitones;
    const naturalMidi = noteToMidi({ name: { letter, accidental: 0 }, octave });
    const accidental = targetMidi - naturalMidi;

    if (accidental < -2 || accidental > 2) {
      throw new Error(
        `No se puede deletrear el grado ${degreeIndex + 1} de ${type} sobre ` +
          `${root.letter}${root.accidental}: requeriría una alteración de ${accidental} semitonos.`,
      );
    }

    const note: Note = { name: { letter, accidental: accidental as Accidental }, octave };
    return { note, midi: targetMidi, degreeIndex };
  });

  return { root: rootNote, type, degrees };
}
