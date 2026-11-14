/**
 * Cómo le fue al usuario en una ronda, a partir de su proporción de aciertos.
 * Es la ÚNICA fuente de los cortes: el color del porcentaje del resultado y el
 * sonido de fin de ronda leen de aquí, así nunca se contradicen (un porcentaje
 * en ámbar no puede sonar a derrota).
 *
 * - `great`: 80 % o más.
 * - `passed`: de 50 % a 79 %. Superada, con margen de mejora.
 * - `failed`: menos de la mitad.
 */
export type RoundOutcome = 'great' | 'passed' | 'failed';

export const ROUND_OUTCOME_THRESHOLDS = {
  great: 0.8,
  passed: 0.5,
} as const;

export function roundOutcome(accuracy: number): RoundOutcome {
  if (accuracy >= ROUND_OUTCOME_THRESHOLDS.great) return 'great';
  if (accuracy >= ROUND_OUTCOME_THRESHOLDS.passed) return 'passed';
  return 'failed';
}

/** La ronda cuenta como superada (todo salvo `failed`). */
export function isRoundCleared(accuracy: number): boolean {
  return roundOutcome(accuracy) !== 'failed';
}
