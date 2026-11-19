import { beatIntervalMs } from './tempo';

/**
 * Calificación de "toca al ritmo" (tap-sync). Compara los instantes de los
 * toques con los de los pulsos, todo en el MISMO reloj (ms).
 *
 * La precisión que se exige es la de alguien que empieza: se perdona la
 * latencia constante del equipo (auriculares Bluetooth, buffers de audio) y
 * solo se mira si cada toque cayó cerca de su golpe.
 */

export const TAP_RULES = {
  /** Desvío máximo para que un toque cuente para su golpe. */
  toleranceMs: 150,
  /** Hasta aquí el toque se considera "justo". */
  goodMs: 75,
  /**
   * Rango de latencia constante que se descuenta. El sonido sale del altavoz
   * DESPUÉS del instante programado, así que el usuario toca "tarde" por un
   * margen fijo que no es culpa suya. Hacia el lado temprano se perdona menos:
   * adelantarse sí es un error de pulso.
   */
  latency: { minMs: -60, maxMs: 250 },
  /** Proporción de toques que hay que acertar para superar el ejercicio. */
  passRatio: 0.75,
} as const;

export type BeatGrade = 'good' | 'ok' | 'miss';

export interface BeatJudgement {
  /** Desvío del toque respecto a su golpe (negativo = antes), ya sin la latencia. */
  readonly offsetMs: number;
  readonly grade: BeatGrade;
}

export interface TapJudgement {
  /** Un juicio por toque, en orden. */
  readonly beats: readonly BeatJudgement[];
  /** Toques dentro de la tolerancia de su golpe. */
  readonly hits: number;
  /** Latencia constante que se descontó. */
  readonly latencyMs: number;
  readonly passed: boolean;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Toques mínimos para estimar la latencia: con menos, una sola desviación la sesgaría. */
const MIN_TAPS_FOR_LATENCY = 3;

/** Golpe del pulso más cercano a `timeMs` (nunca antes del primero). */
function nearestBeat(timeMs: number, firstBeatMs: number, intervalMs: number): number {
  return Math.max(0, Math.round((timeMs - firstBeatMs) / intervalMs));
}

/**
 * Estima la latencia constante: la mediana del desvío de cada toque respecto a
 * su golpe más cercano (la mediana ignora un toque suelto muy desviado).
 */
export function estimateLatency(
  firstBeatMs: number,
  intervalMs: number,
  tapsMs: readonly number[],
): number {
  if (tapsMs.length < MIN_TAPS_FOR_LATENCY) return 0;
  const offsets = tapsMs.map(
    (tap) => tap - (firstBeatMs + nearestBeat(tap, firstBeatMs, intervalMs) * intervalMs),
  );
  return Math.min(TAP_RULES.latency.maxMs, Math.max(TAP_RULES.latency.minMs, median(offsets)));
}

function judgeFrom(
  anchor: number,
  firstBeatMs: number,
  intervalMs: number,
  tapsMs: readonly number[],
): BeatJudgement[] {
  return tapsMs.map((tap, i): BeatJudgement => {
    const offsetMs = Math.round(tap - (firstBeatMs + (anchor + i) * intervalMs));
    if (Math.abs(offsetMs) > TAP_RULES.toleranceMs) return { offsetMs, grade: 'miss' };
    return { offsetMs, grade: Math.abs(offsetMs) <= TAP_RULES.goodMs ? 'good' : 'ok' };
  });
}

function hitsOf(beats: readonly BeatJudgement[]): number {
  return beats.filter((beat) => beat.grade !== 'miss').length;
}

function totalDeviation(beats: readonly BeatJudgement[]): number {
  return beats.reduce((sum, beat) => sum + Math.abs(beat.offsetMs ?? 0), 0);
}

/**
 * Califica toques sobre un pulso que suena sin parar (el golpe `n` suena en
 * `firstBeatMs + n × intervalo`). El usuario empieza cuando quiere, así que no
 * hay golpe "primero": cada toque debe caer en el golpe SIGUIENTE al del
 * anterior. Saltarse un golpe desplaza los que vienen y cuentan como fallo.
 *
 * El golpe de partida es el del primer toque, pero se prueban también sus
 * vecinos: si justo el primer toque se desvió, manda la secuencia entera.
 */
export function judgeTapsOnPulse(
  firstBeatMs: number,
  bpm: number,
  tapsMs: readonly number[],
): TapJudgement {
  if (tapsMs.length === 0) return { beats: [], hits: 0, latencyMs: 0, passed: false };
  const intervalMs = beatIntervalMs(bpm);
  const latencyMs = estimateLatency(firstBeatMs, intervalMs, tapsMs);
  const taps = tapsMs.map((tap) => tap - latencyMs);

  const start = nearestBeat(taps[0], firstBeatMs, intervalMs);
  let beats = judgeFrom(start, firstBeatMs, intervalMs, taps);
  for (const anchor of [start - 1, start + 1]) {
    if (anchor < 0) continue;
    const candidate = judgeFrom(anchor, firstBeatMs, intervalMs, taps);
    const better =
      hitsOf(candidate) > hitsOf(beats) ||
      (hitsOf(candidate) === hitsOf(beats) && totalDeviation(candidate) < totalDeviation(beats));
    if (better) beats = candidate;
  }

  const hits = hitsOf(beats);
  return {
    beats,
    hits,
    latencyMs,
    passed: hits >= Math.ceil(tapsMs.length * TAP_RULES.passRatio),
  };
}
