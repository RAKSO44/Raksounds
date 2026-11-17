/**
 * Contrato del metrónomo de las lecciones de ritmo. A diferencia del piano (un
 * gesto = una nota), aquí la temporización lo es todo: los golpes se programan
 * por adelantado en el reloj de audio, con precisión de muestra, porque un
 * `setTimeout` por golpe tiembla decenas de ms y eso se oye en un pulso.
 */
export interface IMetronome {
  /** Prepara el sonido del golpe. Memoizado. */
  load(): Promise<void>;

  /**
   * Programa un golpe en cada instante de `onsetsMs` (ms desde el inicio) y
   * cancela lo que hubiera programado antes.
   *
   * Devuelve cuándo sonará el instante 0, en el reloj de `performance.now()`:
   * es la referencia con la que se comparan los toques del usuario. `null` si
   * el motor no está listo (no suena nada).
   */
  play(onsetsMs: readonly number[]): number | null;

  /** Corta los golpes pendientes. Idempotente. */
  stop(): void;
}
