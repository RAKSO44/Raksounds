import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { ISoundEffects, SoundEffect } from '@/domain/audio/ISoundEffects';

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
 * Nivel de los efectos frente al piano (que va a ≈ -7 dB). Un sonido de
 * feedback acompaña a la corrección; no debe tapar la nota que se está
 * comparando ni sonar más fuerte que ella.
 */
const EFFECTS_GAIN = 0.5;

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
