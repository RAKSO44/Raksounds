import { Note, NoteName, noteToMidi, spellFromRoot } from './note';
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
 * (tónica + semitonos) y la nota natural de esa letra (ver `spellFromRoot`).
 * Así cada tonalidad queda deletreada correctamente (C♯ mayor produce E♯ y B♯;
 * G♯ menor melódica produce F♯♯) sin tablas por tonalidad.
 */
export function buildScale(root: NoteName, rootOctave: number, type: ScaleType): Scale {
  const formula: ScaleFormula = SCALE_FORMULAS[type];
  const rootNote: Note = { name: root, octave: rootOctave };
  const rootMidi = noteToMidi(rootNote);

  const degrees: ScaleDegree[] = formula.semitones.map((semitones, degreeIndex) => {
    const note = spellFromRoot(root, rootOctave, formula.letterSteps[degreeIndex], semitones);

    if (note === null) {
      throw new Error(
        `No se puede deletrear el grado ${degreeIndex + 1} de ${type} sobre ` +
          `${root.letter}${root.accidental}: requeriría más de una doble alteración.`,
      );
    }

    return { note, midi: rootMidi + semitones, degreeIndex };
  });

  return { root: rootNote, type, degrees };
}
