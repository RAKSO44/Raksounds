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

import { AudioTimeMs } from './IAudioClock';

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
   *
   * Con `atMs` (reloj de audio) se suelta en ese instante y no ahora: una
   * figura larga que debe callar justo en el próximo pulso. Si para entonces
   * ya había terminado sola, no cambia nada.
   */
  noteOff(handle: VoiceHandle, atMs?: AudioTimeMs): void;

  /**
   * Una nota de duración EXACTA, programada en el reloj de audio (sin el
   * temblor de un temporizador): su sonido arranca justo en `atMs` (el ataque
   * de la muestra cae ahí, no su silencio inicial) y se apaga a los
   * `durationMs` con un apagado breve, como el apagador de un piano. Es lo que
   * hace que una figura suene lo que vale: con la duración mínima de
   * `noteOff`, una corchea y una semicorchea sonaban igual de largas.
   *
   * `atMs` es del reloj que comparte con el metrónomo (`IAudioClock`): así
   * una nota programada en el instante de un golpe suena CON el golpe.
   *
   * `noteOff` la corta antes de tiempo; si aún no había empezado, ya no suena.
   */
  playTimed(midi: number, atMs: AudioTimeMs, durationMs: number): VoiceHandle;

  /** Libera todas las voces en curso. */
  stopAll(): void;

  /** Libera los recursos de audio. Tras esto, hay que volver a llamar a load(). */
  unload(): Promise<void>;
}
