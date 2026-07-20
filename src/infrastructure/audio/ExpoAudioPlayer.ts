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
 * Voces (players) por muestra. Cada muestra cubre ±1 semitono, así que dos
 * grados consecutivos pueden compartirla (D4 y E4 usan D♯4): con varias voces
 * un acorde que comparte muestra suena completo y el usuario puede "spamear"
 * la misma tecla sin que una pulsación corte a la anterior. Se precargan TODAS
 * en load() (nunca se crean durante la reproducción: crear un player en caliente
 * hacía que la nota arrancara a mitad del ataque).
 */
const VOICES_PER_SAMPLE = 3;

/**
 * Duración máxima de una nota. Las apps de práctica de oído/canto no dejan sonar
 * el piano indefinidamente (Perfect Piano, Simply Piano y similares cortan por
 * ~1.5–2 s): un decay corto se siente ágil y no cansa. Usamos 1.8 s.
 */
const MAX_NOTE_MS = 1800;
/** Fundido final para que el corte no produzca un "click" audible. */
const FADE_MS = 140;
const FADE_STEPS = 5;

interface Voice {
  readonly player: AudioPlayer;
  /** Timer del corte/fundido programado; se cancela si la voz se re-dispara. */
  timer?: ReturnType<typeof setTimeout>;
}

interface Pool {
  readonly voices: Voice[];
  /** Cursor round-robin: reparte pulsaciones entre las voces de la muestra. */
  cursor: number;
}

/**
 * Implementación real de IAudioPlayer con expo-audio y muestras de piano
 * (ver pianoSampleMap.ts). Única capa del proyecto que conoce expo-audio.
 */
export function createExpoAudioPlayer(): IAudioPlayer {
  // Un pool de voces por MIDI de muestra. Todas se precargan en load().
  const pools = new Map<number, Pool>();
  let loaded = false;

  function makeVoice(source: number): Voice {
    const player = createAudioPlayer(source);
    // Queremos que el cambio de rate SÍ desplace la altura (así afinamos notas
    // intermedias entre muestras); la corrección de pitch lo impediría.
    player.shouldCorrectPitch = false;
    // "Calentamos" el player consumiendo la rareza de expo-audio: el PRIMER
    // setPlaybackRate de un player nuevo se aplica una reproducción tarde (la
    // muestra suena sin afinar y recién se corrige en la 2.ª). Disparamos ese
    // primer setPlaybackRate + play() aquí, EN MUDO, con un rate distinto de 1
    // para que la primera nota real que oiga el usuario ya salga afinada.
    player.volume = 0;
    player.setPlaybackRate(2 ** (1 / 12));
    player.play();
    player.pause();
    player.seekTo(0);
    player.setPlaybackRate(1);
    player.volume = 1;
    return { player };
  }

  function clearTimer(voice: Voice) {
    if (voice.timer) {
      clearTimeout(voice.timer);
      voice.timer = undefined;
    }
  }

  /** Reinicia una voz a su estado de reposo (parada, al inicio, a volumen pleno). */
  function reset(voice: Voice) {
    clearTimer(voice);
    voice.player.pause();
    voice.player.seekTo(0);
    voice.player.volume = 1;
  }

  /** Programa el fundido + corte para acotar la duración de la nota. */
  function scheduleFade(voice: Voice) {
    let step = 0;
    const tick = () => {
      step += 1;
      voice.player.volume = Math.max(0, 1 - step / FADE_STEPS);
      if (step >= FADE_STEPS) {
        voice.player.pause();
        voice.player.seekTo(0);
        voice.player.volume = 1;
        voice.timer = undefined;
      } else {
        voice.timer = setTimeout(tick, FADE_MS / FADE_STEPS);
      }
    };
    voice.timer = setTimeout(tick, MAX_NOTE_MS - FADE_MS);
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
        const voices: Voice[] = [];
        for (let i = 0; i < VOICES_PER_SAMPLE; i += 1) {
          voices.push(makeVoice(sample.source));
        }
        pools.set(sample.midi, { voices, cursor: 0 });
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

      // Round-robin: repartimos entre las voces para dar polifonía y absorber
      // el "spam". La voz elegida puede seguir sonando de un toque anterior;
      // por eso se para antes de re-disparar (en expo-audio, play() sobre un
      // player que ya está sonando es no-op y no reinicia el ataque).
      const voice = pool.voices[pool.cursor];
      pool.cursor = (pool.cursor + 1) % pool.voices.length;

      clearTimer(voice);
      voice.player.pause();
      voice.player.setPlaybackRate(playbackRateFor(midi, sample));
      voice.player.seekTo(0);
      voice.player.volume = 1;
      voice.player.play();
      scheduleFade(voice);
    },

    stopAll() {
      for (const pool of pools.values()) {
        for (const voice of pool.voices) {
          reset(voice);
        }
      }
    },

    async unload() {
      for (const pool of pools.values()) {
        for (const voice of pool.voices) {
          clearTimer(voice);
          voice.player.remove();
        }
      }
      pools.clear();
      loaded = false;
    },
  };
}
