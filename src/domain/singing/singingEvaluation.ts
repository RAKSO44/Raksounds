import { NoteName, pitchClassOf, spellPitchClass } from '../music-theory';
import { ChordFunction } from './chords';
import { SingingExercise } from './singingGenerator';

/**
 * Calificación de una nota cantada.
 *
 * Se califica SIN IMPORTAR LA OCTAVA (decisión de producto): el piano suena en
 * C4–C6 y una voz grave canta naturalmente una octava abajo, así que cantar el
 * Sol pedido en cualquier octava es correcto. La consecuencia conocida es que
 * en entonación de intervalos la 8ª justa se acierta repitiendo la nota base.
 *
 * Las desviaciones se miden en cents (1 semitono = 100 cents).
 */

/**
 * Hasta aquí la toma es "perfecta". 10 cents es lo más fino que la detección
 * por micrófono distingue de forma fiable; por debajo sería ruido de medida.
 */
export const PERFECT_CENTS = 10;
/** Hasta aquí la nota está afinada. */
export const IN_TUNE_CENTS = 25;
/**
 * Hasta aquí es "la nota correcta, pero desafinada": se redondearía a la nota
 * pedida, aunque no basta para darla por buena.
 */
export const CLOSE_CENTS = 50;

/**
 * - `perfect`: clavada (|desviación| ≤ 10 cents). Es un acierto.
 * - `correct`: afinada (|desviación| ≤ 25 cents).
 * - `close`: la nota pedida, pero desafinada (≤ 50 cents). Vale medio punto.
 * - `wrong`: otra nota.
 */
export type SingingVerdict = 'perfect' | 'correct' | 'close' | 'wrong';

/** Si el veredicto cuenta como acierto completo en la ronda (`perfect` y `correct`). */
export function isSingingHit(verdict: SingingVerdict): boolean {
  return verdict === 'perfect' || verdict === 'correct';
}

/**
 * Lo que vale un "casi" frente a un acierto completo. Dio con la nota y solo
 * le faltó afinarla: no es lo mismo que cantar otra nota, así que suma la
 * mitad (2 "casi" en 10 preguntas dejan la ronda en 90 %, no en 80 %).
 */
export const CLOSE_SCORE = 0.5;

/** Puntos que suma una toma a la ronda: 1 acierto, `CLOSE_SCORE` un "casi", 0 otra nota. */
export function singingScore(verdict: SingingVerdict): number {
  if (isSingingHit(verdict)) return 1;
  return verdict === 'close' ? CLOSE_SCORE : 0;
}

export interface SingingEvaluation {
  readonly verdict: SingingVerdict;
  /**
   * Desviación respecto a la nota pedida, plegada a la octava más cercana, en
   * (-600, 600]. Positiva = se cantó más alto; negativa = más bajo.
   */
  readonly centsOff: number;
  /** Semitonos (0–11) de la nota cantada, redondeada, sobre la nota base. */
  readonly sungOffset: number;
}

/** Pliega una diferencia en semitonos al intervalo (-6, 6]. */
function foldToOctave(semitones: number): number {
  const folded = ((semitones % 12) + 12) % 12;
  return folded > 6 ? folded - 12 : folded;
}

export function verdictFor(centsOff: number): SingingVerdict {
  const distance = Math.abs(centsOff);
  if (distance <= PERFECT_CENTS) return 'perfect';
  if (distance <= IN_TUNE_CENTS) return 'correct';
  if (distance <= CLOSE_CENTS) return 'close';
  return 'wrong';
}

export function evaluateSinging(exercise: SingingExercise, sungMidi: number): SingingEvaluation {
  const centsOff = Math.round(foldToOctave(sungMidi - exercise.targetMidi) * 100);
  const sungOffset = ((Math.round(sungMidi - exercise.rootMidi) % 12) + 12) % 12;
  return { verdict: verdictFor(centsOff), centsOff, sungOffset };
}

/**
 * Función del acorde que el usuario cantó en vez de la pedida, si la nota
 * cantada (redondeada, en cualquier octava) es una del acorde. Es lo que permite
 * decir "cantaste la 5ª" en vez de solo "incorrecto".
 */
export function sungChordFunction(
  exercise: SingingExercise,
  evaluation: SingingEvaluation,
): ChordFunction | null {
  if (exercise.kind !== 'singNote') return null;
  const tone = exercise.tones.find(
    (candidate) =>
      (((candidate.midi - exercise.rootMidi) % 12) + 12) % 12 === evaluation.sungOffset,
  );
  return tone?.fn ?? null;
}

/**
 * Nombre de la nota que se cantó (redondeada a la más cercana, sin octava). Se
 * deletrea con bemoles si la tónica del ejercicio lleva bemol y con sostenidos
 * si no, para que "cantaste D♭" no aparezca en un ejercicio en C♯.
 */
export function sungNoteName(exercise: SingingExercise, evaluation: SingingEvaluation): NoteName {
  const preference = exercise.root.accidental < 0 ? 'flat' : 'sharp';
  return spellPitchClass(pitchClassOf(exercise.root) + evaluation.sungOffset, preference);
}
