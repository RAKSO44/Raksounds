import { IntervalId } from './intervals';

/**
 * Niveles de dificultad de una ronda.
 *
 * Son ACUMULATIVOS: cada nivel añade intervalos a los del anterior, de modo que
 * el nivel 7 incluye los doce. El criterio de orden es cuánto cuesta el
 * intervalo al oído, no su tamaño: octava y quinta justas son las referencias
 * más estables, las terceras y sextas definen el color mayor/menor, los
 * segundos y séptimos son los más cercanos entre sí, y el tritono cierra.
 */

export type LevelTier = 'easy' | 'medium' | 'hard' | 'expert';

export interface ExerciseLevel {
  /** Número visible del nivel (1–7). Es también su identificador en las rutas. */
  readonly number: number;
  /** Intervalos que ESTE nivel incorpora respecto al anterior. */
  readonly added: readonly IntervalId[];
  /** Todos los intervalos que pueden salir en el nivel (acumulado). */
  readonly intervals: readonly IntervalId[];
  /** Franja de dificultad; la UI la traduce a color. */
  readonly tier: LevelTier;
}

const LEVEL_STEPS: readonly { added: readonly IntervalId[]; tier: LevelTier }[] = [
  { added: ['P8', 'P5'], tier: 'easy' },
  { added: ['P4'], tier: 'easy' },
  { added: ['M3', 'm3'], tier: 'medium' },
  { added: ['M6', 'm6'], tier: 'medium' },
  { added: ['M2', 'm2'], tier: 'hard' },
  { added: ['M7', 'm7'], tier: 'hard' },
  { added: ['TT'], tier: 'expert' },
];

export const EXERCISE_LEVELS: readonly ExerciseLevel[] = LEVEL_STEPS.reduce<ExerciseLevel[]>(
  (levels, step, index) => {
    const previous = levels[index - 1]?.intervals ?? [];
    levels.push({
      number: index + 1,
      added: step.added,
      intervals: [...previous, ...step.added],
      tier: step.tier,
    });
    return levels;
  },
  [],
);

export const FIRST_LEVEL_NUMBER = 1;
export const LAST_LEVEL_NUMBER = EXERCISE_LEVELS.length;

/** Nivel por su número, o `null` si no existe (p. ej. un parámetro de ruta inválido). */
export function levelByNumber(levelNumber: number): ExerciseLevel | null {
  return EXERCISE_LEVELS.find((level) => level.number === levelNumber) ?? null;
}
