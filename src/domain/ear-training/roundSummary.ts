import { IntervalId } from './intervals';
import { ExerciseKind } from './exerciseGenerator';

/**
 * Resumen de una ronda terminada. Es una función pura sobre la lista de
 * respuestas: la pantalla solo pinta el resultado, no calcula nada.
 */

export interface AnswerRecord {
  readonly kind: ExerciseKind;
  /** Intervalo correcto del ejercicio. */
  readonly answer: IntervalId;
  /** Lo que el usuario eligió. */
  readonly chosen: IntervalId;
  /** Tiempo desde que apareció el ejercicio hasta que confirmó, en ms. */
  readonly elapsedMs: number;
}

export interface RoundSummary {
  readonly total: number;
  readonly correctCount: number;
  /** Proporción de aciertos en [0, 1]. Con 0 respuestas es 0. */
  readonly accuracy: number;
  /** Tiempo medio por pregunta en ms. Con 0 respuestas es 0. */
  readonly averageMs: number;
  /** Racha más larga de aciertos seguidos. */
  readonly bestStreak: number;
  /** Intervalos fallados al menos una vez, sin repetir, en orden de aparición. */
  readonly missedIntervals: readonly IntervalId[];
  /** Intervalo acertado en el menor tiempo; `null` si no acertó ninguno. */
  readonly fastestInterval: IntervalId | null;
  /** Tiempo de ese acierto más rápido, en ms. */
  readonly fastestMs: number | null;
}

export function summarizeRound(answers: readonly AnswerRecord[]): RoundSummary {
  const total = answers.length;
  const missed: IntervalId[] = [];
  let correctCount = 0;
  let totalMs = 0;
  let streak = 0;
  let bestStreak = 0;
  let fastestInterval: IntervalId | null = null;
  let fastestMs: number | null = null;

  for (const record of answers) {
    totalMs += record.elapsedMs;
    const isCorrect = record.chosen === record.answer;

    if (isCorrect) {
      correctCount += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      if (fastestMs === null || record.elapsedMs < fastestMs) {
        fastestMs = record.elapsedMs;
        fastestInterval = record.answer;
      }
    } else {
      streak = 0;
      if (!missed.includes(record.answer)) missed.push(record.answer);
    }
  }

  return {
    total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    averageMs: total === 0 ? 0 : totalMs / total,
    bestStreak,
    missedIntervals: missed,
    fastestInterval,
    fastestMs,
  };
}
