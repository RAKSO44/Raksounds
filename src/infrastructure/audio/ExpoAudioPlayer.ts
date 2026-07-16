import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { IAudioPlayer } from '@/domain/audio/IAudioPlayer';
import {
  MAX_PLAYABLE_MIDI,
  MIN_PLAYABLE_MIDI,
  nearestSample,
  PIANO_SAMPLES,
  playbackRateFor,
} from './pianoSampleMap';

/**
 * Players simultáneos por muestra. Dos grados consecutivos de una escala
 * pueden compartir muestra (ej. D4 y E4 usan D♯4): sin un segundo player,
 * tocar el siguiente grado cortaría el anterior de golpe.
 */
const MAX_PLAYERS_PER_SAMPLE = 2;

/**
 * Implementación real de IAudioPlayer con expo-audio y muestras de piano
 * (ver pianoSampleMap.ts). Única capa del proyecto que conoce expo-audio.
 */
export function createExpoAudioPlayer(): IAudioPlayer {
  // Pool de players por MIDI de muestra. El primero se precarga en load();
  // el segundo se crea bajo demanda si la muestra ya está sonando.
  const pools = new Map<number, AudioPlayer[]>();
  let loaded = false;

  function makePlayer(source: number): AudioPlayer {
    const player = createAudioPlayer(source);
    // Queremos que el cambio de rate SÍ desplace la altura (así afinamos
    // notas intermedias entre muestras); la corrección de pitch lo impediría.
    player.shouldCorrectPitch = false;
    return player;
  }

  return {
    async load() {
      if (loaded) return;
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      for (const sample of PIANO_SAMPLES) {
        pools.set(sample.midi, [makePlayer(sample.source)]);
      }
      loaded = true;
    },

    playNote(midi: number) {
      if (!loaded) {
        throw new Error('ExpoAudioPlayer: llama a load() antes de playNote().');
      }
      if (midi < MIN_PLAYABLE_MIDI || midi > MAX_PLAYABLE_MIDI) {
        throw new Error(
          `ExpoAudioPlayer: MIDI ${midi} fuera del rango reproducible ` +
            `[${MIN_PLAYABLE_MIDI}, ${MAX_PLAYABLE_MIDI}].`,
        );
      }

      const sample = nearestSample(midi);
      const pool = pools.get(sample.midi)!;

      let player = pool.find((p) => !p.playing);
      if (!player) {
        if (pool.length < MAX_PLAYERS_PER_SAMPLE) {
          player = makePlayer(sample.source);
          pool.push(player);
        } else {
          // Pool lleno: se retrigger-ea el más antiguo (corte aceptable).
          player = pool[0];
        }
      }

      player.setPlaybackRate(playbackRateFor(midi, sample));
      player.seekTo(0);
      player.play();
    },

    stopAll() {
      for (const pool of pools.values()) {
        for (const player of pool) {
          player.pause();
        }
      }
    },

    async unload() {
      for (const pool of pools.values()) {
        for (const player of pool) {
          player.remove();
        }
      }
      pools.clear();
      loaded = false;
    },
  };
}
