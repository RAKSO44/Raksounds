import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { ISoundEffects, SoundEffect } from '@/domain/audio/ISoundEffects';

import { MASTER_GAIN } from './PianoSamplerPlayer';

/**
 * Efectos de los ejercicios (acierto, error, ronda superada / no superada)
 * sobre react-native-audio-api, igual que el piano: se decodifican una vez y
 * cada disparo crea un `AudioBufferSourceNode` nuevo y desechable.
 *
 * Tienen su propio contexto y no pasan por el bus del piano: el limitador de
 * ese bus está calibrado para acordes, y un efecto que coincide con una tecla
 * aún sonando no debe empujarlo ni ser comprimido por él.
 */

const SOURCES: Record<SoundEffect, number> = {
  success: require('../../../assets/audio/effects/success.mp3'),
  error: require('../../../assets/audio/effects/error.mp3'),
  cleared: require('../../../assets/audio/effects/cleared.mp3'),
  failed: require('../../../assets/audio/effects/failed.mp3'),
};

/**
 * La MISMA ganancia que el bus del piano. Los archivos ya están nivelados a la
 * sonoridad media de las notas (`scripts/level-sound-effects.mjs`), así que
 * con igual ganancia un efecto suena exactamente tan fuerte como una nota: ni
 * la tapa ni queda por debajo. Para cambiar el nivel de un efecto se regenera
 * el archivo, no se toca esta constante.
 */
const EFFECTS_GAIN = MASTER_GAIN;

export function createSoundEffectsPlayer(): ISoundEffects {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  const buffers = new Map<SoundEffect, AudioBuffer>();
  let loading: Promise<void> | undefined;

  return {
    load() {
      loading ??= (async () => {
        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = EFFECTS_GAIN;
        gain.connect(ctx.destination);

        await Promise.all(
          (Object.keys(SOURCES) as SoundEffect[]).map(async (effect) => {
            buffers.set(effect, await ctx.decodeAudioData(SOURCES[effect]));
          }),
        );

        context = ctx;
        output = gain;
      })().catch(() => {
        // Sin efectos la app sigue funcionando: se permite reintentar al
        // siguiente `load()` en vez de quedar con una promesa rechazada.
        loading = undefined;
      });
      return loading;
    },

    play(effect: SoundEffect) {
      const ctx = context;
      const gain = output;
      const buffer = buffers.get(effect);
      if (!ctx || !gain || !buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onEnded = () => {
        try {
          source.disconnect();
        } catch {
          /* ya desconectado al cerrar el contexto */
        }
      };
      source.start(ctx.currentTime);
    },
  };
}
