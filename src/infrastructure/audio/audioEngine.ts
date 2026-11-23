import { AudioContext } from 'react-native-audio-api';

import { IAudioClock } from '@/domain/audio';

/**
 * El contexto de audio que comparten el piano y el metrónomo.
 *
 * Antes cada uno abría el suyo, y eso desalineaba de oído una figura y su
 * pulso aunque se programaran "al mismo ms": dos contextos son dos flujos de
 * salida con su propia latencia y dos relojes que avanzan a saltos distintos
 * (y derivan entre sí), así que pasar por `performance.now()` para casarlos
 * metía un desfase distinto en cada nota. Con UN contexto todo se programa en
 * el mismo reloj y sale por el mismo flujo: suena junto por construcción.
 * (De paso, el sistema mantiene un flujo de salida en vez de dos.)
 *
 * Los efectos de los ejercicios siguen con el suyo: no se programan contra
 * nada (ver `SoundEffectsPlayer.ts`).
 */
let context: AudioContext | undefined;

/** El contexto compartido; se crea la primera vez que alguien lo pide. */
export function sharedAudioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

/** El reloj de ese contexto, en ms. */
export const audioClock: IAudioClock = {
  now: () => (context?.currentTime ?? 0) * 1000,
};
