import { INTERVALS, IntervalId, RoundSummary } from '@/domain/ear-training';

/**
 * El resumen viaja de la ronda a su pantalla como un parámetro de ruta. Va
 * serializado (y no en un store global) porque es un dato de un solo uso: la
 * pantalla de resultados no debe poder abrirse "con lo último que hubiera",
 * y así la ruta sigue siendo autocontenida también al recargar en web.
 */

export function encodeRoundSummary(summary: RoundSummary): string {
  return JSON.stringify(summary);
}

function isIntervalId(value: unknown): value is IntervalId {
  return typeof value === 'string' && value in INTERVALS;
}

function numberAt(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** `null` si el parámetro falta o no tiene la forma de un resumen. */
export function decodeRoundSummary(raw: string | undefined): RoundSummary | null {
  if (raw == null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const source = parsed as Record<string, unknown>;
  const total = numberAt(source, 'total');
  const correctCount = numberAt(source, 'correctCount');
  const accuracy = numberAt(source, 'accuracy');
  const averageMs = numberAt(source, 'averageMs');
  const averageReplays = numberAt(source, 'averageReplays');
  if (
    total === null ||
    correctCount === null ||
    accuracy === null ||
    averageMs === null ||
    averageReplays === null
  ) {
    return null;
  }

  const missed = source.missedIntervals;
  const fastestInterval = isIntervalId(source.fastestInterval) ? source.fastestInterval : null;

  return {
    total,
    correctCount,
    accuracy,
    averageMs,
    averageReplays,
    missedIntervals: Array.isArray(missed) ? missed.filter(isIntervalId) : [],
    fastestInterval,
    fastestMs: numberAt(source, 'fastestMs'),
  };
}
