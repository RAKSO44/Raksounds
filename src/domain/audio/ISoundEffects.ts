/**
 * Contrato de los efectos de sonido de los ejercicios: sonidos cortos que se
 * disparan y terminan solos (no hay "note off", a diferencia de `IAudioPlayer`).
 *
 * - `success` / `error`: al corregir un ejercicio.
 * - `cleared` / `failed`: al aparecer el resultado de una ronda, según
 *   `roundOutcome` (`domain/ear-training/roundOutcome.ts`).
 */
export type SoundEffect = 'success' | 'error' | 'cleared' | 'failed';

export interface ISoundEffects {
  /** Precarga los sonidos. Memoizado: puede llamarse desde cada pantalla. */
  load(): Promise<void>;

  /**
   * Dispara un efecto. Nunca lanza: si aún no cargaron, simplemente no suena
   * (un sonido de feedback que falta no debe romper la corrección).
   */
  play(effect: SoundEffect): void;
}
