import { ModuleId } from './stages';

/**
 * Progreso por módulo. Nada se bloquea: se puede entrar a cualquier módulo, a
 * su teoría o a su práctica, en cualquier orden; el progreso solo indica qué se
 * ha hecho. Todo puro: el almacenamiento lo pone la feature.
 */

/**
 * Proporción de aciertos que completa una práctica. Cada módulo tiene los
 * ejercicios que su lección pide (no siempre 15), así que el corte es un
 * porcentaje: 12/15, 9/11…
 */
export const PRACTICE_PASS_RATIO = 0.8;

/** Aciertos mínimos para completar una práctica de `total` ejercicios. */
export function practicePassScore(total: number): number {
  return Math.ceil(total * PRACTICE_PASS_RATIO);
}

export interface ModuleProgress {
  readonly theoryCompleted: boolean;
  /** ISO de la primera vez que se completó; repasar no la cambia. */
  readonly theoryCompletedAt: string | null;
  readonly practiceCompleted: boolean;
  readonly practiceCompletedAt: string | null;
  readonly bestScore: number | null;
  readonly lastScore: number | null;
  readonly attempts: number;
}

export type ProgressMap = Partial<Record<ModuleId, ModuleProgress>>;

export const EMPTY_PROGRESS: ModuleProgress = {
  theoryCompleted: false,
  theoryCompletedAt: null,
  practiceCompleted: false,
  practiceCompletedAt: null,
  bestScore: null,
  lastScore: null,
  attempts: 0,
};

export function progressOf(map: ProgressMap, id: ModuleId): ModuleProgress {
  return map[id] ?? EMPTY_PROGRESS;
}

export function isPracticePassed(score: number, total: number): boolean {
  return score >= practicePassScore(total);
}

/** Marca la teoría como completada. Repasarla conserva la fecha original. */
export function completeTheory(progress: ModuleProgress, at: string): ModuleProgress {
  if (progress.theoryCompleted) return progress;
  return { ...progress, theoryCompleted: true, theoryCompletedAt: at };
}

/**
 * Registra un "Reintentar fallos": NO es un intento nuevo, es terminar el
 * mismo. `score` ya es el total del intento (aciertos de antes + los
 * recuperados), así que puede completar la práctica.
 */
export function recordRetry(
  progress: ModuleProgress,
  score: number,
  total: number,
  at: string,
): ModuleProgress {
  const passed = isPracticePassed(score, total);
  return {
    ...progress,
    lastScore: score,
    bestScore: Math.max(progress.bestScore ?? 0, score),
    practiceCompleted: progress.practiceCompleted || passed,
    practiceCompletedAt: progress.practiceCompletedAt ?? (passed ? at : null),
  };
}

/**
 * Registra un intento terminado. Un intento peor que uno anterior NUNCA quita
 * el completado: repetir es para practicar, no un riesgo.
 */
export function recordPractice(
  progress: ModuleProgress,
  score: number,
  total: number,
  at: string,
): ModuleProgress {
  const passed = isPracticePassed(score, total);
  return {
    ...progress,
    attempts: progress.attempts + 1,
    lastScore: score,
    bestScore: Math.max(progress.bestScore ?? 0, score),
    practiceCompleted: progress.practiceCompleted || passed,
    practiceCompletedAt: progress.practiceCompletedAt ?? (passed ? at : null),
  };
}
