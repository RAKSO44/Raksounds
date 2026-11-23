/**
 * El reloj de audio que comparten el piano y el metrónomo.
 *
 * Todo lo que deba sonar JUNTO (una figura encima de su pulso) se programa en
 * este reloj, nunca a partir de `performance.now()`: son relojes distintos
 * (el de audio lo marca la tarjeta de sonido, avanza a saltos de un bloque y
 * deriva unos ms por minuto respecto del de JS), y convertir de uno a otro en
 * cada nota mete un desfase distinto cada vez, que se oye.
 */

/** Un instante del reloj de audio, en ms. */
export type AudioTimeMs = number;

export interface IAudioClock {
  /** Ahora, en el reloj de audio (0 si el motor aún no arrancó). */
  now(): AudioTimeMs;
}
