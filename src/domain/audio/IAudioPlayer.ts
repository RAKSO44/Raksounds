/**
 * Contrato de reproducción de audio. El dominio y las features dependen de
 * esta interfaz; la implementación real (expo-audio + muestras de piano)
 * vive en `src/infrastructure/audio/`.
 */
export interface IAudioPlayer {
  /** Precarga las muestras necesarias. Debe llamarse antes de reproducir. */
  load(): Promise<void>;

  /**
   * Reproduce una nota por su número MIDI (C4 = 60).
   * Las pulsaciones rápidas deben poder solaparse (polifonía).
   */
  playNote(midi: number): void;

  /** Detiene todo sonido en curso. */
  stopAll(): void;

  /** Libera los recursos de audio. Tras esto, hay que volver a llamar a load(). */
  unload(): Promise<void>;
}
