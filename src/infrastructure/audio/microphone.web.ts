import {
  IMicrophone,
  MicrophoneFrame,
  MicrophonePermission,
  MicrophoneStartResult,
} from '@/domain/audio/IMicrophone';

/**
 * Micrófono en web. El `AudioRecorder` de react-native-audio-api no tiene
 * implementación web, así que aquí se usa la API del navegador directamente:
 * `getUserMedia` → `AnalyserNode`, leyendo un bloque cada ~46 ms (el mismo
 * tamaño que entrega el nativo). Requiere HTTPS (GitHub Pages lo es) o
 * localhost.
 */

const BLOCK_SIZE = 2048;

interface Session {
  stream: MediaStream;
  context: AudioContext;
  timer: ReturnType<typeof setInterval>;
}

let session: Session | null = null;

async function stop(): Promise<void> {
  if (session === null) return;
  const { stream, context, timer } = session;
  session = null;
  clearInterval(timer);
  stream.getTracks().forEach((track) => track.stop());
  await context.close().catch(() => undefined);
}

/**
 * Abre el micrófono del navegador (y con ello pide permiso si hace falta).
 * Devuelve el problema en vez del stream cuando no se puede.
 */
async function openStream(): Promise<MediaStream | Exclude<MicrophonePermission, 'granted'>> {
  if (typeof navigator === 'undefined' || navigator.mediaDevices?.getUserMedia == null) {
    return 'unavailable';
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      // El procesado "de llamada" del navegador deforma la voz cantada: la
      // supresión de ruido corta notas largas y el control de ganancia aplana
      // el volumen que pintan las barras.
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (error) {
    const denied = error instanceof DOMException && error.name === 'NotAllowedError';
    return denied ? 'denied' : 'unavailable';
  }
}

/**
 * El navegador no tiene un "pedir permiso" aparte: se abre el micrófono, lo
 * que muestra el aviso, y se cierra en el acto. Concedido una vez, `start()`
 * ya no vuelve a preguntar.
 */
async function requestPermission(): Promise<MicrophonePermission> {
  const stream = await openStream();
  if (typeof stream === 'string') return stream;
  stream.getTracks().forEach((track) => track.stop());
  return 'granted';
}

async function start(onFrame: (frame: MicrophoneFrame) => void): Promise<MicrophoneStartResult> {
  await stop();
  const stream = await openStream();
  if (typeof stream === 'string') return stream;

  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = BLOCK_SIZE;
  context.createMediaStreamSource(stream).connect(analyser);

  const intervalMs = (BLOCK_SIZE / context.sampleRate) * 1000;
  const timer = setInterval(() => {
    const samples = new Float32Array(BLOCK_SIZE);
    analyser.getFloatTimeDomainData(samples);
    onFrame({ samples, sampleRate: context.sampleRate });
  }, intervalMs);

  session = { stream, context, timer };
  return 'started';
}

export const microphone: IMicrophone = { requestPermission, start, stop };
