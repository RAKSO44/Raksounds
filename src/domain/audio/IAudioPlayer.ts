/**
 * Contrato de reproducción de audio. El dominio y las features dependen de
 * esta interfaz; la implementación real (motor de muestras + piano Salamander)
 * vive en `src/infrastructure/audio/`.
 *
 * El contrato es de tipo "note on / note off", no "reproduce un sonido": una
 * tecla suena mientras el dedo la mantiene y se libera al soltarla, igual que
 * un piano. Por eso `noteOn` devuelve un identificador de VOZ y `noteOff` no
 * recibe la altura MIDI: dos pulsaciones de la misma nota son dos voces
 * distintas que se solapan, y cada una debe poder soltarse por separado.
 */

/**
 * Identificador opaco de una voz sonando. Se obtiene en `noteOn` y es lo único
 * que `noteOff` acepta.
 */
export type VoiceHandle = number;

/** Valor devuelto por `noteOn` cuando la nota no se pudo iniciar. */
export const NO_VOICE: VoiceHandle = -1;

export interface IAudioPlayer {
  /** Precarga las muestras necesarias. Debe llamarse antes de reproducir. */
  load(): Promise<void>;

  /**
   * Inicia una nota por su número MIDI (C4 = 60) y devuelve su voz.
   * Varias notas pueden sonar a la vez sin límite práctico; llamarlo dos veces
   * seguidas para la misma nota crea dos voces que se superponen.
   *
   * Devuelve `NO_VOICE` si la nota está fuera del banco o el motor aún no está
   * listo: iniciar una nota NUNCA lanza, porque se llama desde un gesto y un
   * error ahí dejaría la UI a medio pulsar.
   */
  noteOn(midi: number): VoiceHandle;

  /**
   * Libera una voz. El sonido no se corta de golpe: baja gradualmente. Además
   * se garantiza una duración mínima, de modo que un toque instantáneo suene
   * completo en vez de quedar en un chasquido.
   *
   * Es idempotente y tolera voces ya terminadas o desconocidas.
   */
  noteOff(handle: VoiceHandle): void;

  /**
   * Ajusta el volumen de la app (0 = silencio, 0.5 = normal, 1 = máximo), que
   * es independiente del volumen del sistema. Afecta a las voces que ya están
   * sonando y a las siguientes, y puede llamarse antes de `load()`.
   */
  setVolume(volume: number): void;

  /** Libera todas las voces en curso. */
  stopAll(): void;

  /** Libera los recursos de audio. Tras esto, hay que volver a llamar a load(). */
  unload(): Promise<void>;
}
