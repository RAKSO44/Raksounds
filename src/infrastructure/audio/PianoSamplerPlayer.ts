import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { IAudioPlayer, NO_VOICE, VoiceHandle } from '@/domain/audio/IAudioPlayer';
import { PIANO_SAMPLES, sampleFor } from './pianoSampleMap';

/**
 * Motor de piano por muestras, construido sobre react-native-audio-api
 * (implementación nativa de la Web Audio API). Única capa del proyecto que
 * conoce esa librería.
 *
 * POR QUÉ NO UN REPRODUCTOR DE MEDIOS (expo-audio / AVPlayer / ExoPlayer)
 * ---------------------------------------------------------------------
 * La versión anterior mantenía un pool de `AudioPlayer` y los reciclaba con
 * `pause()` + `seekTo(0)`. Un reproductor de medios está pensado para UNA pista
 * larga, no para disparar muestras, y de ahí salían los tres bugs reportados:
 *
 *  - "a veces presiono y no suena": `seekTo(0)` es asíncrono; si la siguiente
 *    pulsación llegaba antes de que resolviera, el disparo se descartaba por el
 *    contador de generación.
 *  - "el audio a veces suena comenzado": si `seekTo(0)` no había terminado, el
 *    player arrancaba desde donde se había quedado, sin ataque.
 *  - polifonía limitada: cada nota tenía 2 voces fijas y reciclarlas cortaba la
 *    anterior.
 *
 * Así es como lo resuelven los pianos de verdad (y lo que documenta la guía
 * oficial de react-native-audio-api): las muestras se decodifican UNA vez a
 * memoria y cada pulsación crea un `AudioBufferSourceNode` NUEVO y desechable.
 * Un nodo nuevo siempre empieza en la muestra 0, así que no hay nada que
 * rebobinar, no hay estado compartido entre pulsaciones y no hay carrera
 * posible: los tres bugs desaparecen por construcción, no se parchean.
 *
 * La polifonía deja de tener un límite artificial —el motor mezcla cientos de
 * nodos sin despeinarse—, así que se pueden pulsar todas las notas de la
 * escala a la vez.
 */

/**
 * Rampa de entrada mínima. Las muestras ya traen su propio ataque percusivo, así
 * que aquí NO se modela un ataque: 4 ms solo evitan el "click" de arrancar en
 * mitad de una onda. Alargarlo apagaría el golpe del martillo.
 */
const ATTACK_S = 0.004;

/**
 * Al soltar, la nota baja gradualmente durante este tiempo en vez de cortarse
 * de golpe (es el pedal soltándose, no un mute).
 */
const RELEASE_S = 0.7;

/**
 * Duración total mínima de un toque instantáneo: 1.5 s. Un tap muy corto no
 * debe sonar como un chasquido.
 */
const MIN_SOUNDING_S = 1.5;

/**
 * Instante (relativo al inicio) a partir del cual soltar libera de inmediato.
 * Antes de ese punto el release se retrasa para completar `MIN_SOUNDING_S`.
 * Expresarlo así evita tener que distinguir "toque" de "nota mantenida": es la
 * MISMA fórmula para ambos casos.
 */
const SUSTAIN_FLOOR_S = MIN_SOUNDING_S - RELEASE_S;

/**
 * Ganancia fija del bus (≈ -3 dB de headroom). Las muestras pican casi a
 * 0 dBFS, así que al pulsar toda la escala a la vez la suma empujaba el
 * limitador a saturar de forma audible; este margen hace que los acordes lo
 * rocen suave en vez de clavarse en él. No es una preferencia de usuario: el
 * ajuste de volumen se quitó porque por encima de esto no hay techo digital.
 */
const MASTER_GAIN = 0.7;

/**
 * Umbral por debajo del cual el limitador es transparente (≈ -1.9 dBFS). Una
 * nota sola nunca lo alcanza, así que suena sin tocar.
 */
const LIMIT_THRESHOLD = 0.8;
/** Resolución de la curva del limitador; de sobra para que no se oigan escalones. */
const LIMIT_CURVE_POINTS = 1024;

/**
 * Curva de "soft clip" para el WaveShaper del bus maestro.
 *
 * Sin ella habría que dejar headroom (bajar el volumen general) para que 5 notas
 * simultáneas no pasaran de 0 dBFS, y eso es exactamente lo contrario de lo que
 * se buscaba al subir las muestras. Con la curva, la mezcla puede ir a ganancia
 * plena: por debajo del umbral es una recta (no colorea nada) y por encima
 * comprime con una tangente hiperbólica, de modo que un acorde se dobla suave en
 * vez de recortarse en cuadrado, que es lo que suena a distorsión sucia.
 */
function softClipCurve(): Float32Array {
  const curve = new Float32Array(LIMIT_CURVE_POINTS);
  const headroom = 1 - LIMIT_THRESHOLD;
  for (let i = 0; i < LIMIT_CURVE_POINTS; i += 1) {
    // La curva mapea la entrada [-1, 1] sobre el índice del array.
    const x = (i / (LIMIT_CURVE_POINTS - 1)) * 2 - 1;
    const magnitude = Math.abs(x);
    curve[i] =
      magnitude <= LIMIT_THRESHOLD
        ? x
        : Math.sign(x) *
          (LIMIT_THRESHOLD + headroom * Math.tanh((magnitude - LIMIT_THRESHOLD) / headroom));
  }
  return curve;
}

/** `exponentialRampToValueAtTime` no admite 0 como destino. */
const SILENCE = 0.0001;

/** Fundido de `stopAll()`: corta rápido pero sin click. */
const PANIC_RELEASE_S = 0.08;

interface Voice {
  readonly source: { stop(when?: number): void; disconnect(): void };
  readonly envelope: GainNode;
  /** `currentTime` del contexto en el momento del noteOn. */
  readonly startedAt: number;
  released: boolean;
}

export function createPianoSamplerPlayer(): IAudioPlayer {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  const buffers = new Map<number, AudioBuffer>();
  const voices = new Map<VoiceHandle, Voice>();
  let nextHandle = 0;
  let loading: Promise<void> | undefined;

  /** Programa el release de una voz y la retira del registro. */
  function release(handle: VoiceHandle, voice: Voice, fadeSeconds: number, floor: number) {
    if (voice.released) return;
    voice.released = true;
    voices.delete(handle);

    const ctx = context;
    if (!ctx) return;

    const now = ctx.currentTime;
    // Un toque instantáneo debe durar MIN_SOUNDING_S en total; uno mantenido,
    // lo que dure el gesto más el release. Ambos casos son este único max().
    const releaseAt = Math.max(now, voice.startedAt + floor);
    const endAt = releaseAt + fadeSeconds;

    try {
      voice.envelope.gain.cancelScheduledValues(releaseAt);
      voice.envelope.gain.setValueAtTime(1, releaseAt);
      voice.envelope.gain.exponentialRampToValueAtTime(SILENCE, endAt);
      voice.source.stop(endAt);
    } catch {
      // La voz pudo terminar sola (la muestra se acabó) entre el noteOn y el
      // noteOff: el nodo ya está parado y no hay nada que liberar.
    }
  }

  return {
    load() {
      // Se memoiza la promesa: la Librería es la tab inicial y `load()` puede
      // dispararse dos veces en un remount antes de que la primera resuelva.
      loading ??= (async () => {
        const ctx = new AudioContext();

        // Cadena del bus maestro: voces → ganancia fija → limitador → salida.
        // Las muestras ya salen con la ganancia del banco (+7 dB de
        // `scripts/build-piano-samples.mjs`); aquí solo se deja el headroom de
        // MASTER_GAIN — amplificar por encima es imposible sin saturar, porque
        // los picos del banco ya rozan 0 dBFS.
        const limiter = ctx.createWaveShaper();
        limiter.curve = softClipCurve();
        limiter.connect(ctx.destination);

        const bus = ctx.createGain();
        bus.gain.value = MASTER_GAIN;
        bus.connect(limiter);

        // En paralelo: 25 muestras cortas decodifican en cientos de ms.
        await Promise.all(
          PIANO_SAMPLES.map(async (sample) => {
            buffers.set(sample.midi, await ctx.decodeAudioData(sample.source));
          }),
        );

        context = ctx;
        master = bus;
      })();
      return loading;
    },

    noteOn(midi: number): VoiceHandle {
      const ctx = context;
      const bus = master;
      const buffer = buffers.get(midi);
      // Sin excepciones: esto se llama desde un gesto. Si la nota no está en el
      // banco o el motor no terminó de cargar, simplemente no suena.
      if (!ctx || !bus || !buffer || !sampleFor(midi)) return NO_VOICE;

      const now = ctx.currentTime;

      // Nodo NUEVO por pulsación: nace en la muestra 0 y se descarta al acabar.
      // Es lo que hace innecesario cualquier seek/rewind y, con él, las carreras.
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + ATTACK_S);

      source.connect(envelope);
      envelope.connect(bus);

      const handle = nextHandle;
      nextHandle += 1;
      const voice: Voice = { source, envelope, startedAt: now, released: false };
      voices.set(handle, voice);

      // Si el dedo se queda pulsado más de lo que dura la muestra, la voz se
      // apaga sola: hay que soltar los nodos igual para no acumular memoria.
      source.onEnded = () => {
        voices.delete(handle);
        try {
          envelope.disconnect();
        } catch {
          /* ya desconectado al cerrar el contexto */
        }
      };

      source.start(now);
      return handle;
    },

    noteOff(handle: VoiceHandle) {
      const voice = voices.get(handle);
      // Voz desconocida o ya liberada: idempotente por contrato, porque el
      // gesto puede finalizar dos veces (cancelación + soltado).
      if (!voice) return;
      release(handle, voice, RELEASE_S, SUSTAIN_FLOOR_S);
    },

    stopAll() {
      // Aquí no se respeta la duración mínima: es un corte explícito.
      for (const [handle, voice] of [...voices]) {
        release(handle, voice, PANIC_RELEASE_S, 0);
      }
    },

    async unload() {
      this.stopAll();
      voices.clear();
      buffers.clear();
      const ctx = context;
      context = undefined;
      master = undefined;
      loading = undefined;
      await ctx?.close();
    },
  };
}
