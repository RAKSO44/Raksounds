/**
 * Contrato de captura del micrófono. Las features dependen de esta interfaz; la
 * implementación (react-native-audio-api en nativo, getUserMedia en web) vive
 * en `src/infrastructure/audio/`.
 *
 * Entrega bloques PCM crudos y nada más: qué altura hay en ellos lo decide el
 * dominio (`domain/pitch`), no el micrófono.
 */

export interface MicrophoneFrame {
  /** Muestras mono en [-1, 1]. */
  readonly samples: Float32Array;
  /** Frecuencia de muestreo REAL del bloque (puede no ser la pedida). */
  readonly sampleRate: number;
}

/**
 * - `started`: ya llegan bloques.
 * - `denied`: el usuario no dio permiso de micrófono.
 * - `unavailable`: no hay micrófono o el sistema no pudo abrirlo.
 */
export type MicrophoneStartResult = 'started' | 'denied' | 'unavailable';

export interface IMicrophone {
  /**
   * Pide permiso si hace falta y empieza a escuchar. Nunca lanza: un fallo se
   * devuelve como resultado, porque se llama desde un botón.
   */
  start(onFrame: (frame: MicrophoneFrame) => void): Promise<MicrophoneStartResult>;
  /** Deja de escuchar. Idempotente. */
  stop(): Promise<void>;
}
