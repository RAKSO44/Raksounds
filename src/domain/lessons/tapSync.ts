/**
 * Calificación de "toca al ritmo" (tap-sync). Compara los instantes de los
 * toques con los de los pulsos, todo en el MISMO reloj (ms).
 *
 * La precisión que se exige es la de alguien que empieza: se perdona la
 * latencia constante del equipo (auriculares Bluetooth, buffers de audio) y
 * solo se mira si cada pulso tuvo un toque cerca.
 */

export const TAP_RULES = {
  /** Desvío máximo para que un toque cuente para su pulso. */
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
  /** Proporción de pulsos que hay que acertar para superar el ejercicio. */
  passRatio: 0.75,
} as const;

export type BeatGrade = 'good' | 'ok' | 'miss';

export interface BeatJudgement {
  /** Desvío del toque emparejado (negativo = antes), ya sin la latencia. */
  readonly offsetMs: number | null;
  readonly grade: BeatGrade;
}

export interface TapJudgement {
  readonly beats: readonly BeatJudgement[];
  /** Pulsos con un toque dentro de la tolerancia. */
  readonly hits: number;
  /** Toques que no se emparejaron con ningún pulso. */
  readonly extraTaps: number;
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

/**
 * Estima la latencia constante: la mediana del desvío de cada toque respecto a
 * su pulso más cercano (la mediana ignora un toque suelto muy desviado).
 */
export function estimateLatency(beatsMs: readonly number[], tapsMs: readonly number[]): number {
  if (beatsMs.length === 0 || tapsMs.length < MIN_TAPS_FOR_LATENCY) return 0;
  const offsets = tapsMs.map((tap) => {
    let best = tap - beatsMs[0];
    for (const beat of beatsMs) {
      if (Math.abs(tap - beat) < Math.abs(best)) best = tap - beat;
    }
    return best;
  });
  return Math.min(TAP_RULES.latency.maxMs, Math.max(TAP_RULES.latency.minMs, median(offsets)));
}

/**
 * Empareja cada pulso con el toque libre más cercano (ya sin latencia) dentro
 * de la tolerancia. Un toque solo vale para un pulso: tocar sin parar no
 * acierta todos.
 */
export function judgeTaps(beatsMs: readonly number[], tapsMs: readonly number[]): TapJudgement {
  const latencyMs = estimateLatency(beatsMs, tapsMs);
  const taps = tapsMs.map((tap) => tap - latencyMs);
  const used = new Set<number>();

  const beats = beatsMs.map((beat): BeatJudgement => {
    let bestIndex = -1;
    for (let i = 0; i < taps.length; i += 1) {
      if (used.has(i)) continue;
      const distance = Math.abs(taps[i] - beat);
      if (distance > TAP_RULES.toleranceMs) continue;
      if (bestIndex === -1 || distance < Math.abs(taps[bestIndex] - beat)) bestIndex = i;
    }
    if (bestIndex === -1) return { offsetMs: null, grade: 'miss' };
    used.add(bestIndex);
    const offsetMs = Math.round(taps[bestIndex] - beat);
    return { offsetMs, grade: Math.abs(offsetMs) <= TAP_RULES.goodMs ? 'good' : 'ok' };
  });

  const hits = beats.filter((beat) => beat.grade !== 'miss').length;
  const extraTaps = taps.length - used.size;
  // Tocar al azar muchas veces podría "cazar" pulsos: más de medio toque de
  // sobra por pulso deja de ser seguir el pulso.
  const passed =
    hits >= Math.ceil(beatsMs.length * TAP_RULES.passRatio) &&
    extraTaps <= Math.floor(beatsMs.length / 2);

  return { beats, hits, extraTaps, latencyMs, passed };
}
