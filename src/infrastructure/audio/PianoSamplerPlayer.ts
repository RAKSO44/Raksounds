import { AudioBuffer, AudioContext, GainNode } from 'react-native-audio-api';

import { AudioTimeMs, IAudioPlayer, NO_VOICE, VoiceHandle } from '@/domain/audio';

import { PIANO_SAMPLES, sampleFor } from './pianoSampleMap';
import { sampleOnset } from './sampleOnset';

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
 * Ganancia fija del bus (≈ -7 dB). Deshace a propósito los +7 dB con que
 * `scripts/build-piano-samples.mjs` sube el banco: una muestra pica casi a
 * 0 dBFS, así que en cuanto sonaban 3–4 a la vez (el acorde de la entonación,
 * su tecla "acorde completo", una escala entera) la suma pasaba de 1 y se
 * oía como estática, aun con el volumen del teléfono bajo — el recorte es
 * digital, ocurre antes del volumen del sistema. A este nivel una cuatríada
 * cabe casi siempre sin tocar el limitador. Una nota sola queda al nivel de
 * la grabación original. No es una preferencia de usuario: subirla es
 * exactamente lo que satura (ver el commit que quitó el ajuste de volumen).
 */
export const MASTER_GAIN = 0.45;

/**
 * Umbral por debajo del cual el limitador es transparente (≈ -1.9 dBFS). Una
 * nota sola nunca lo alcanza, así que suena sin tocar.
 */
const LIMIT_THRESHOLD = 0.8;
/**
 * Amplitud máxima de entrada que el limitador dobla con suavidad (+12 dB sobre
 * el fondo de escala). Un WaveShaper solo define su curva para [-1, 1] y FIJA
 * todo lo que cae fuera al valor del extremo: eso es un recorte duro, el
 * "cuadrado" que suena a estática. Antes la curva acababa en 1, así que una
 * suma de 1.3 ya se recortaba en seco; ahora la señal entra dividida entre
 * este rango y la curva lo vuelve a multiplicar, de modo que hasta ±4 el
 * exceso se comprime con la tangente y nunca se cuadra.
 */
const LIMIT_RANGE = 4;
/** Resolución de la curva del limitador; de sobra para que no se oigan escalones. */
const LIMIT_CURVE_POINTS = 4096;

/**
 * Curva de "soft clip" para el WaveShaper del bus maestro, sobre una entrada
 * ya dividida entre `LIMIT_RANGE`.
 *
 * Por debajo del umbral es una recta (no colorea nada) y por encima comprime
 * con una tangente hiperbólica que tiende a 1 sin alcanzarlo, de modo que un
 * pico que se escapa se dobla suave en vez de recortarse en cuadrado.
 */
function softClipCurve(): Float32Array {
  const curve = new Float32Array(LIMIT_CURVE_POINTS);
  const headroom = 1 - LIMIT_THRESHOLD;
  for (let i = 0; i < LIMIT_CURVE_POINTS; i += 1) {
    // El índice del array recorre la entrada [-1, 1], que representa
    // [-LIMIT_RANGE, LIMIT_RANGE] de la señal real.
    const x = ((i / (LIMIT_CURVE_POINTS - 1)) * 2 - 1) * LIMIT_RANGE;
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

/**
 * Apagado de una nota de duración exacta (`playTimed`): el apagador de un
 * piano, no el pedal. Corto para que la duración se oiga tal cual (una
 * semicorchea a 80 BPM dura 190 ms) y lo justo para que no haga click.
 */
const DAMPER_S = 0.06;

/**
 * Tramo inicial de cada muestra donde se busca su ataque (`sampleOnset`):
 * cubre de sobra el silencio del MP3 (≤ 50 ms) y el pico del martillo.
 */
const ONSET_SCAN_S = 0.3;
/** El ataque empieza donde la señal llega a esta fracción de su pico (−20 dB). */
const ONSET_THRESHOLD = 0.1;

/**
 * Una muestra lista para sonar. No se lee desde 0 sino desde `cue`: lo de
 * antes es el silencio que deja el MP3 (ver `sampleOnset`), y con él toda
 * nota sonaba decenas de ms tarde respecto del metrónomo.
 */
interface Sample {
  readonly buffer: AudioBuffer;
  /** Desde dónde se lee (s): `ATTACK_S` antes del ataque, para que la rampa de entrada no lo toque. */
  readonly cue: number;
  /** Lo que tarda en llegar el ataque desde `cue` (s). */
  readonly lead: number;
}

interface Voice {
  readonly source: { stop(when?: number): void; disconnect(): void };
  readonly envelope: GainNode;
  /** `currentTime` del contexto en el que SUENA su ataque (puede ser futuro). */
  readonly startedAt: number;
  /** Cuándo empieza a callar sola (`Infinity` si espera a que la suelten). */
  readonly endsAt: number;
  /** De duración exacta (`playTimed`): cortarla no respeta la duración mínima. */
  readonly timed: boolean;
  released: boolean;
}

/**
 * El piano suena en el contexto que comparte con el metrónomo
 * (`audioEngine.ts`): se recibe en vez de crearlo para que una figura y su
 * pulso se programen en el MISMO reloj.
 */
export function createPianoSamplerPlayer(getContext: () => AudioContext): IAudioPlayer {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let limiter: { disconnect(): void } | undefined;
  const samples = new Map<number, Sample>();
  const voices = new Map<VoiceHandle, Voice>();
  let nextHandle = 0;
  let loading: Promise<void> | undefined;

  /**
   * Programa el release de una voz (ahora, o en `atSeconds` del reloj de
   * audio) y la retira del registro.
   */
  function release(
    handle: VoiceHandle,
    voice: Voice,
    fadeSeconds: number,
    floor: number,
    atSeconds?: number,
  ) {
    if (voice.released) return;
    voice.released = true;
    voices.delete(handle);

    const ctx = context;
    if (!ctx) return;

    const now = ctx.currentTime;
    const when = Math.max(now, atSeconds ?? now);
    if (when < voice.startedAt) {
      // Se corta antes de que suene: se silencia y no llega a sonar.
      try {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(0, now);
        voice.source.stop(voice.startedAt + ATTACK_S);
      } catch {
        /* ya parada */
      }
      return;
    }
    // Para entonces ya calla sola (una figura que termina antes del corte).
    if (when >= voice.endsAt) return;
    // Un toque instantáneo debe durar MIN_SOUNDING_S en total; uno mantenido,
    // lo que dure el gesto más el release. Ambos casos son este único max().
    const releaseAt = Math.max(when, voice.startedAt + floor);
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

  /**
   * Crea la voz de una nota cuyo ataque suena en `atSeconds` (reloj de audio;
   * ahora mismo si ya pasó), o `null` si no puede sonar. Con `durationSeconds`
   * se apaga sola a esa distancia; sin él, espera a `noteOff`. Sin
   * excepciones: se llama desde un gesto, y si la nota no está en el banco o
   * el motor no terminó de cargar, simplemente no suena.
   */
  function startVoice(
    midi: number,
    atSeconds: number,
    durationSeconds?: number,
  ): { handle: VoiceHandle; voice: Voice } | null {
    const ctx = context;
    const bus = master;
    const sample = samples.get(midi);
    if (!ctx || !bus || !sample || !sampleFor(midi)) return null;

    // La lectura arranca `lead` antes, para que el ATAQUE caiga en `atSeconds`.
    const startAt = Math.max(ctx.currentTime, atSeconds - sample.lead);
    const at = startAt + sample.lead;

    // Nodo NUEVO por pulsación: nace en su `cue` y se descarta al acabar.
    // Es lo que hace innecesario cualquier seek/rewind y, con él, las carreras.
    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.linearRampToValueAtTime(1, startAt + ATTACK_S);

    let endsAt = Infinity;
    if (durationSeconds !== undefined) {
      // Todo queda programado de una vez: el apagador baja justo al acabar la
      // duración y el nodo se detiene cuando ya no suena.
      endsAt = at + Math.max(0, durationSeconds);
      envelope.gain.setValueAtTime(1, endsAt);
      envelope.gain.exponentialRampToValueAtTime(SILENCE, endsAt + DAMPER_S);
      source.stop(endsAt + DAMPER_S);
    }

    source.connect(envelope);
    envelope.connect(bus);

    const handle = nextHandle;
    nextHandle += 1;
    const voice: Voice = {
      source,
      envelope,
      startedAt: at,
      endsAt,
      timed: durationSeconds !== undefined,
      released: false,
    };
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

    source.start(startAt, sample.cue);
    return { handle, voice };
  }

  /** Dónde empieza a sonar la muestra (ver `Sample`). Se mide una vez, al cargar. */
  function prepare(buffer: AudioBuffer): Sample {
    const head = new Float32Array(
      Math.min(buffer.length, Math.ceil(ONSET_SCAN_S * buffer.sampleRate)),
    );
    buffer.copyFromChannel(head, 0);
    const onset = sampleOnset(head, ONSET_THRESHOLD) / buffer.sampleRate;
    const cue = Math.max(0, onset - ATTACK_S);
    return { buffer, cue, lead: onset - cue };
  }

  return {
    load() {
      // Se memoiza la promesa: la Librería es la tab inicial y `load()` puede
      // dispararse dos veces en un remount antes de que la primera resuelva.
      loading ??= (async () => {
        const ctx = getContext();

        // Cadena del bus maestro:
        //   voces → ganancia fija → ÷ LIMIT_RANGE → limitador → salida.
        // La división se aplica en la misma ganancia del bus (es lineal), y la
        // curva del limitador devuelve la señal a su escala real.
        const shaper = ctx.createWaveShaper();
        shaper.curve = softClipCurve();
        shaper.connect(ctx.destination);

        const bus = ctx.createGain();
        bus.gain.value = MASTER_GAIN / LIMIT_RANGE;
        bus.connect(shaper);

        // En paralelo: 25 muestras cortas decodifican en cientos de ms.
        await Promise.all(
          PIANO_SAMPLES.map(async (sample) => {
            samples.set(sample.midi, prepare(await ctx.decodeAudioData(sample.source)));
          }),
        );

        context = ctx;
        master = bus;
        limiter = shaper;
      })();
      return loading;
    },

    noteOn(midi: number): VoiceHandle {
      return startVoice(midi, 0)?.handle ?? NO_VOICE;
    },

    noteOff(handle: VoiceHandle, atMs?: AudioTimeMs) {
      const voice = voices.get(handle);
      // Voz desconocida o ya liberada: idempotente por contrato, porque el
      // gesto puede finalizar dos veces (cancelación + soltado).
      if (!voice) return;
      const at = atMs === undefined ? undefined : atMs / 1000;
      if (voice.timed) release(handle, voice, DAMPER_S, 0, at);
      else release(handle, voice, RELEASE_S, SUSTAIN_FLOOR_S, at);
    },

    playTimed(midi: number, atMs: AudioTimeMs, durationMs: number): VoiceHandle {
      return startVoice(midi, atMs / 1000, durationMs / 1000)?.handle ?? NO_VOICE;
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
      samples.clear();
      // El contexto es compartido (el metrónomo sigue en él): se suelta solo
      // la cadena del piano.
      master?.disconnect();
      limiter?.disconnect();
      context = undefined;
      master = undefined;
      limiter = undefined;
      loading = undefined;
    },
  };
}
