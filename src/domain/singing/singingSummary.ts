import { IntervalId } from '../ear-training';
import { ChordFunction } from './chords';
import { SingingVerdict } from './singingEvaluation';
import { SingingExercise } from './singingGenerator';

/**
 * Resumen de una ronda de entonación. Igual que el de la identificación, es una
 * función pura sobre las respuestas: la pantalla solo pinta el resultado.
 */

/** Qué se pidió cantar: un intervalo o una función de acorde. */
export type SingingTarget =
  | { readonly kind: 'interval'; readonly interval: IntervalId }
  | { readonly kind: 'chordTone'; readonly fn: ChordFunction };

/** Lo que pedía un ejercicio, en la forma en que se agrupa en el resumen. */
export function singingTargetOf(exercise: SingingExercise): SingingTarget {
  return exercise.kind === 'singInterval'
    ? { kind: 'interval', interval: exercise.interval }
    : { kind: 'chordTone', fn: exercise.targetFunction };
}

export interface SingingRecord {
  readonly target: SingingTarget;
  readonly verdict: SingingVerdict;
  /** Desviación con signo, en cents (ver `SingingEvaluation`). */
  readonly centsOff: number;
  /** Desde que apareció el ejercicio hasta que terminó la toma calificada, en ms. */
  readonly elapsedMs: number;
  /** Veces que se repitió un sonido ya oído (ver `countReplays`). */
  readonly replayCount: number;
}

export interface SingingSummary {
  readonly total: number;
  readonly correctCount: number;
  /** Proporción de aciertos en [0, 1]. Con 0 respuestas es 0. */
  readonly accuracy: number;
  readonly averageMs: number;
  readonly averageReplays: number;
  /**
   * Desviación media (en valor absoluto) de las tomas en que se cantó la NOTA
   * correcta (aciertos y "casi"). Mide la afinación fina; incluir las notas
   * equivocadas la llenaría de cientos de cents que miden otra cosa.
   * `null` si ninguna toma dio con la nota.
   */
  readonly averageCentsOff: number | null;
  /**
   * Media CON signo de esas mismas tomas: si es claramente negativa, la voz
   * tiende a quedarse baja; si es positiva, a subirse. `null` como arriba.
   */
  readonly tendencyCents: number | null;
  /** Objetivos fallados al menos una vez, sin repetir, en orden de aparición. */
  readonly missedTargets: readonly SingingTarget[];
}

function sameTarget(a: SingingTarget, b: SingingTarget): boolean {
  if (a.kind === 'interval' && b.kind === 'interval') return a.interval === b.interval;
  if (a.kind === 'chordTone' && b.kind === 'chordTone') return a.fn === b.fn;
  return false;
}

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarizeSingingRound(records: readonly SingingRecord[]): SingingSummary {
  const total = records.length;
  const missed: SingingTarget[] = [];
  let correctCount = 0;

  for (const record of records) {
    if (record.verdict === 'correct') correctCount += 1;
    else if (!missed.some((target) => sameTarget(target, record.target)))
      missed.push(record.target);
  }

  const onTarget = records
    .filter((record) => record.verdict !== 'wrong')
    .map((record) => record.centsOff);
  const averageCentsOff = mean(onTarget.map(Math.abs));
  const tendencyCents = mean(onTarget);

  return {
    total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    averageMs: mean(records.map((record) => record.elapsedMs)) ?? 0,
    averageReplays: mean(records.map((record) => record.replayCount)) ?? 0,
    averageCentsOff,
    tendencyCents,
    missedTargets: missed,
  };
}
