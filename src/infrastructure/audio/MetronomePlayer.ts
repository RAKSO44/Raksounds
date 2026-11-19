import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { IMetronome, PulseLoop, PulseLoopOptions } from '@/domain/audio/IMetronome';

import { MASTER_GAIN } from './PianoSamplerPlayer';

/**
 * Metrónomo sobre react-native-audio-api. Cada golpe es un
 * `AudioBufferSourceNode` desechable programado con `start(when)` en el reloj
 * del contexto: así el pulso sale exacto aunque el hilo de JS vaya cargado.
 *
 * El golpe se SINTETIZA una vez al cargar (no es una nota, no viene del banco
 * del piano): un "toc" de madera corto, para que el pulso no se confunda con
 * una altura musical.
 */

/** Margen entre programar y el primer golpe: lo que tarda el puente en llegar. */
const LEAD_S = 0.12;

/** Duración del golpe sintetizado. */
const CLICK_S = 0.06;
/** Caída exponencial del golpe (constante de tiempo). */
const CLICK_DECAY_S = 0.012;

interface ClickVoice {
  /** Una fundamental y un parcial inarmónico de madera. */
  frequencies: readonly [number, number];
  /** Pico del golpe. Con la ganancia del bus, 0.9 queda al nivel de una nota de piano. */
  peak: number;
}

/** El golpe de los ejercicios (todos iguales). */
const CLICK: ClickVoice = { frequencies: [1250, 2900], peak: 0.9 };
/**
 * Pulso continuo de la teoría: el fuerte es más agudo y a pleno; los débiles,
 * el golpe de siempre más suave. La diferencia se oye sin que suene a otro
 * instrumento.
 */
const ACCENT_CLICK: ClickVoice = { frequencies: [1700, 3900], peak: 0.95 };
const WEAK_CLICK: ClickVoice = { frequencies: [1250, 2900], peak: 0.5 };

function clickSamples(sampleRate: number, voice: ClickVoice): Float32Array<ArrayBuffer> {
  const length = Math.round(CLICK_S * sampleRate);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t / CLICK_DECAY_S);
    const tone =
      0.7 * Math.sin(2 * Math.PI * voice.frequencies[0] * t) +
      0.3 * Math.sin(2 * Math.PI * voice.frequencies[1] * t);
    samples[i] = voice.peak * envelope * tone;
  }
  return samples;
}

/**
 * Pulso continuo: cada `LOOP_TICK_MS` se programan en el reloj de audio los
 * golpes que caen en los próximos `LOOP_LOOKAHEAD_S`. El temporizador de JS
 * solo decide CUÁNDO programar; el instante del golpe lo fija el reloj de
 * audio, así que el pulso no tiembla aunque el hilo de JS se retrase.
 */
const LOOP_TICK_MS = 40;
const LOOP_LOOKAHEAD_S = 0.15;

/** Reloj de JS en ms (el mismo con el que se miden los toques). */
function nowMs(): number {
  return performance.now();
}

type Source = ReturnType<AudioContext['createBufferSource']>;

export function createMetronomePlayer(): IMetronome {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let buffers: { click: AudioBuffer; accent: AudioBuffer; weak: AudioBuffer } | undefined;
  let loading: Promise<void> | undefined;
  let scheduled = new Set<Source>();
  /** Detiene el pulso continuo en marcha (sus temporizadores de JS). */
  let stopLoop: (() => void) | undefined;

  function stop() {
    stopLoop?.();
    stopLoop = undefined;
    for (const source of scheduled) {
      try {
        source.stop(0);
      } catch {
        /* ya terminó o nunca arrancó */
      }
    }
    scheduled = new Set();
  }

  /** Un golpe desechable en `when` (segundos del reloj de audio). */
  function hit(ctx: AudioContext, gain: GainNode, buffer: AudioBuffer, when: number) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    const owner = scheduled;
    source.onEnded = () => {
      owner.delete(source);
      try {
        source.disconnect();
      } catch {
        /* ya desconectado */
      }
    };
    source.start(when);
    scheduled.add(source);
  }

  return {
    load() {
      loading ??= (async () => {
        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = MASTER_GAIN;
        gain.connect(ctx.destination);

        const toBuffer = (voice: ClickVoice) => {
          const samples = clickSamples(ctx.sampleRate, voice);
          const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
          buffer.copyToChannel(samples, 0);
          return buffer;
        };

        context = ctx;
        output = gain;
        buffers = {
          accent: toBuffer(ACCENT_CLICK),
          weak: toBuffer(WEAK_CLICK),
          click: toBuffer(CLICK),
        };
      })().catch(() => {
        // Sin metrónomo la lección sigue: se reintenta en el siguiente load().
        loading = undefined;
      });
      return loading;
    },

    play(onsetsMs: readonly number[]) {
      stop();
      const ctx = context;
      const gain = output;
      if (!ctx || !gain || !buffers) return null;

      const startAt = ctx.currentTime + LEAD_S;
      for (const onset of onsetsMs) hit(ctx, gain, buffers.click, startAt + onset / 1000);
      return nowMs() + LEAD_S * 1000;
    },

    loop({ bpm, isAccent, onBeat }: PulseLoopOptions): PulseLoop | null {
      stop();
      const ctx = context;
      const gain = output;
      const voices = buffers;
      if (!ctx || !gain || !voices) return null;

      let interval = 60 / bpm;
      let next = ctx.currentTime + LEAD_S;
      let index = 0;
      const uiTimers = new Set<ReturnType<typeof setTimeout>>();

      const schedule = () => {
        while (next < ctx.currentTime + LOOP_LOOKAHEAD_S) {
          const beat = { index, accent: isAccent(index) };
          hit(ctx, gain, beat.accent ? voices.accent : voices.weak, next);
          // La UI se entera cuando el golpe SUENA, no cuando se programa.
          const timer = setTimeout(
            () => {
              uiTimers.delete(timer);
              onBeat(beat);
            },
            Math.max(0, (next - ctx.currentTime) * 1000),
          );
          uiTimers.add(timer);
          next += interval;
          index += 1;
        }
      };

      schedule();
      const ticker = setInterval(schedule, LOOP_TICK_MS);
      const stopThis = () => {
        clearInterval(ticker);
        uiTimers.forEach(clearTimeout);
        uiTimers.clear();
      };
      stopLoop = stopThis;

      return {
        setBpm(newBpm: number) {
          // El próximo golpe se recoloca desde el último que sonó, nunca en el pasado.
          const newInterval = 60 / newBpm;
          next = Math.max(next - interval + newInterval, ctx.currentTime + LEAD_S / 2);
          interval = newInterval;
        },
        // Un pulso viejo no puede cortar lo que se programó después de él.
        stop() {
          if (stopLoop === stopThis) stop();
        },
      };
    },

    stop,
  };
}
