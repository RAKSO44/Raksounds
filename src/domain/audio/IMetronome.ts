/**
 * Contrato del metrónomo de las lecciones de ritmo. A diferencia del piano (un
 * gesto = una nota), aquí la temporización lo es todo: los golpes se programan
 * por adelantado en el reloj de audio, con precisión de muestra, porque un
 * `setTimeout` por golpe tiembla decenas de ms y eso se oye en un pulso.
 */
/** Un golpe de un pulso continuo, avisado cuando SUENA (no cuando se programa). */
export interface PulseBeat {
  /** Número de golpe desde que arrancó el pulso, desde 0. */
  readonly index: number;
  /** Golpe fuerte: suena más marcado. */
  readonly accent: boolean;
}

export interface PulseLoopOptions {
  bpm: number;
  /** Decide qué golpes son fuertes (la regla vive en `domain/lessons`). */
  isAccent: (index: number) => boolean;
  onBeat: (beat: PulseBeat) => void;
}

/** Un pulso que suena sin fin hasta detenerlo. */
export interface PulseLoop {
  /**
   * Cuándo suena el golpe 0, en el reloj de `performance.now()`. Mientras no
   * cambie el tempo, el golpe `n` suena en `startMs + n × intervalo`: es la
   * referencia con la que se califican los toques.
   */
  readonly startMs: number;
  /** Cambia la velocidad en vivo: el siguiente golpe ya llega al tempo nuevo. */
  setBpm(bpm: number): void;
  stop(): void;
}

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

  /**
   * Arranca un pulso continuo (el corazón de la teoría, los metrónomos de la
   * práctica). Como `play`, cancela
   * lo que sonara antes; `play` y `stop` también lo detienen. `null` si el
   * motor no está listo.
   */
  loop(options: PulseLoopOptions): PulseLoop | null;

  /** Corta los golpes pendientes (y el pulso continuo). Idempotente. */
  stop(): void;
}
