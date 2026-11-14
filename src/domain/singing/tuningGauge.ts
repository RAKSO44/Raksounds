import { CLOSE_CENTS, IN_TUNE_CENTS } from './singingEvaluation';

/**
 * Lectura de la barra de afinación que se muestra al corregir: una escala de
 * -50 a +50 cents centrada en la nota que había que cantar.
 *
 * El rango es el de "casi" (`CLOSE_CENTS`): más allá ya es otra nota, y lo que
 * importa entonces no es cuánto se pasó sino hacia qué lado. Por eso una toma
 * fuera de escala se pega al borde y avisa del lado.
 */

/** Media amplitud de la escala, en cents. */
export const GAUGE_RANGE_CENTS = CLOSE_CENTS;

export interface TuningGaugeReading {
  /** Posición de la marca en [0, 1]: 0 = -50 cents, 0.5 = afinado, 1 = +50. */
  readonly position: number;
  /** La toma se salió de la escala: `low` = más grave, `high` = más aguda. */
  readonly overflow: 'low' | 'high' | null;
}

export function tuningGaugeReading(centsOff: number): TuningGaugeReading {
  const clamped = Math.max(-GAUGE_RANGE_CENTS, Math.min(GAUGE_RANGE_CENTS, centsOff));
  const overflow =
    centsOff < -GAUGE_RANGE_CENTS ? 'low' : centsOff > GAUGE_RANGE_CENTS ? 'high' : null;
  return { position: (clamped + GAUGE_RANGE_CENTS) / (2 * GAUGE_RANGE_CENTS), overflow };
}

/**
 * Zona afinada (±25 cents) como fracción [inicio, fin] del ancho de la barra.
 */
export const GAUGE_IN_TUNE_ZONE: readonly [number, number] = [
  (GAUGE_RANGE_CENTS - IN_TUNE_CENTS) / (2 * GAUGE_RANGE_CENTS),
  (GAUGE_RANGE_CENTS + IN_TUNE_CENTS) / (2 * GAUGE_RANGE_CENTS),
];
