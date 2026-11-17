import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { IMetronome } from '@/domain/audio/IMetronome';

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
/** Frecuencias del "toc": una fundamental y un parcial inarmónico de madera. */
const CLICK_FREQUENCIES = [1250, 2900] as const;
/** Caída exponencial del golpe (constante de tiempo). */
const CLICK_DECAY_S = 0.012;
/** Pico del golpe. Con la ganancia del bus queda al nivel de una nota de piano. */
const CLICK_PEAK = 0.9;

function clickSamples(sampleRate: number): Float32Array<ArrayBuffer> {
  const length = Math.round(CLICK_S * sampleRate);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t / CLICK_DECAY_S);
    const tone =
      0.7 * Math.sin(2 * Math.PI * CLICK_FREQUENCIES[0] * t) +
      0.3 * Math.sin(2 * Math.PI * CLICK_FREQUENCIES[1] * t);
    samples[i] = CLICK_PEAK * envelope * tone;
  }
  return samples;
}

/** Reloj de JS en ms (el mismo con el que se miden los toques). */
function nowMs(): number {
  return performance.now();
}

export function createMetronomePlayer(): IMetronome {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let click: AudioBuffer | undefined;
  let loading: Promise<void> | undefined;
  let scheduled: { stop(when?: number): void }[] = [];

  function stop() {
    for (const source of scheduled) {
      try {
        source.stop(0);
      } catch {
        /* ya terminó o nunca arrancó */
      }
    }
    scheduled = [];
  }

  return {
    load() {
      loading ??= (async () => {
        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = MASTER_GAIN;
        gain.connect(ctx.destination);

        const samples = clickSamples(ctx.sampleRate);
        const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
        buffer.copyToChannel(samples, 0);

        context = ctx;
        output = gain;
        click = buffer;
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
      const buffer = click;
      if (!ctx || !gain || !buffer) return null;

      const startAt = ctx.currentTime + LEAD_S;
      scheduled = onsetsMs.map((onset) => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        source.onEnded = () => {
          try {
            source.disconnect();
          } catch {
            /* ya desconectado */
          }
        };
        source.start(startAt + onset / 1000);
        return source;
      });
      return nowMs() + LEAD_S * 1000;
    },

    stop,
  };
}
