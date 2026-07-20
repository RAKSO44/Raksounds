import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { IAudioPlayer } from '@/domain/audio/IAudioPlayer';
import {
  MAX_PLAYABLE_MIDI,
  MIN_PLAYABLE_MIDI,
  PIANO_SAMPLES,
  sampleFor,
} from './pianoSampleMap';

/**
 * Voces (players) por nota. Con el banco cromático cada nota tiene su propio
 * pool, así que dos notas distintas NUNCA compiten por un player: la polifonía
 * entre notas es total. Estas voces solo sirven para solapar la MISMA nota
 * repetida ("spam"), donde 2 bastan para alternar sin cortar el ataque previo.
 *
 * 25 notas × 2 = 50 players, menos que los 63 del banco anterior.
 */
const VOICES_PER_NOTE = 2;

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
  /**
   * Se incrementa en CADA disparo. El trabajo asíncrono (seekTo, fundido) lleva
   * el valor que tenía al programarse y se descarta si ya no coincide: así una
   * pulsación nueva nunca es pisada por el fundido de la anterior.
   */
  generation: number;
  /**
   * true si el player quedó en una posición distinta de 0 (ya reprodujo algo).
   * Una voz limpia puede sonar con `play()` directo, sin esperar un `seekTo`.
   */
  dirty: boolean;
}

interface Pool {
  readonly voices: Voice[];
  /** Cursor round-robin: reparte pulsaciones entre las voces de la nota. */
  cursor: number;
}

/**
 * Implementación real de IAudioPlayer con expo-audio y muestras de piano
 * (ver pianoSampleMap.ts). Única capa del proyecto que conoce expo-audio.
 *
 * Dos reglas que NO hay que romper, porque cada una arregla un bug real:
 *
 * 1. Nunca se llama a `setPlaybackRate`. El banco es cromático, así que toda
 *    nota suena a rate 1. Cambiar el rate justo antes de `play()` no se aplica
 *    desde la muestra 0 (ExoPlayer lo propaga async en su hilo), y eso hacía que
 *    D4/F4/B4 arrancaran con la altura de la muestra cruda y "se corrigieran
 *    solas" a mitad del ataque.
 *
 * 2. `seekTo()` devuelve una Promise y hay que ESPERARLA antes de `play()`.
 *    Encadenarlos sin esperar hacía que la voz arrancara desde donde había
 *    quedado, y la nota sonaba "incompleta" (sin ataque) al pulsar dos teclas
 *    seguidas muy rápido.
 */
export function createExpoAudioPlayer(): IAudioPlayer {
  // Un pool de voces por nota. Todas se precargan en load(): crear un player en
  // caliente hacía que la nota arrancara a mitad del ataque.
  const pools = new Map<number, Pool>();
  let loaded = false;

  function clearTimer(voice: Voice) {
    if (voice.timer) {
      clearTimeout(voice.timer);
      voice.timer = undefined;
    }
  }

  /** `seekTo` es asíncrono; se normaliza a Promise para poder encadenarlo. */
  function seekToStart(voice: Voice): Promise<void> {
    return Promise.resolve(voice.player.seekTo(0)).catch(() => {
      /* el player pudo ser liberado mientras tanto: ignorar */
    });
  }

  /** Programa el fundido + corte para acotar la duración de la nota. */
  function scheduleFade(voice: Voice, generation: number) {
    let step = 0;
    const tick = () => {
      // Llegó una pulsación más nueva a esta voz: este fundido ya no aplica.
      if (voice.generation !== generation) return;
      step += 1;
      voice.player.volume = Math.max(0, 1 - step / FADE_STEPS);
      if (step >= FADE_STEPS) {
        voice.timer = undefined;
        voice.player.pause();
        voice.player.volume = 1;
        void seekToStart(voice).then(() => {
          // Solo se marca limpia si nadie la re-disparó mientras rebobinaba.
          if (voice.generation === generation) voice.dirty = false;
        });
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
        for (let i = 0; i < VOICES_PER_NOTE; i += 1) {
          voices.push({
            player: createAudioPlayer(sample.source),
            generation: 0,
            dirty: false,
          });
        }
        pools.set(sample.midi, { voices, cursor: 0 });
      }
      loaded = true;
    },

    playNote(midi: number) {
      if (!loaded) {
        throw new Error('ExpoAudioPlayer: llama a load() antes de playNote().');
      }
      if (midi < MIN_PLAYABLE_MIDI || midi > MAX_PLAYABLE_MIDI || !sampleFor(midi)) {
        throw new Error(
          `ExpoAudioPlayer: MIDI ${midi} fuera del rango reproducible ` +
            `[${MIN_PLAYABLE_MIDI}, ${MAX_PLAYABLE_MIDI}].`,
        );
      }

      const pool = pools.get(midi)!;
      const voice = pool.voices[pool.cursor];
      pool.cursor = (pool.cursor + 1) % pool.voices.length;

      const generation = (voice.generation += 1);
      clearTimer(voice);
      voice.player.volume = 1;

      if (!voice.dirty) {
        // Camino rápido: la voz está en reposo y en la posición 0, así que puede
        // sonar ya. Sin seekTo de por medio no hay latencia ni riesgo de perder
        // el ataque.
        voice.dirty = true;
        voice.player.play();
        scheduleFade(voice, generation);
        return;
      }

      // La voz venía sonando: hay que rebobinarla ANTES de volver a reproducir,
      // y el rebobinado es asíncrono.
      voice.player.pause();
      void seekToStart(voice).then(() => {
        if (voice.generation !== generation) return;
        voice.player.play();
        scheduleFade(voice, generation);
      });
    },

    stopAll() {
      for (const pool of pools.values()) {
        for (const voice of pool.voices) {
          clearTimer(voice);
          voice.generation += 1;
          voice.player.pause();
          voice.player.volume = 1;
          voice.dirty = false;
          void seekToStart(voice);
        }
      }
    },

    async unload() {
      for (const pool of pools.values()) {
        for (const voice of pool.voices) {
          clearTimer(voice);
          voice.generation += 1;
          voice.player.remove();
        }
      }
      pools.clear();
      loaded = false;
    },
  };
}
