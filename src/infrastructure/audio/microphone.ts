import { AudioManager, AudioRecorder } from 'react-native-audio-api';

import {
  IMicrophone,
  MicrophoneFrame,
  MicrophonePermission,
  MicrophoneStartResult,
} from '@/domain/audio';

/**
 * Micrófono nativo (Android/iOS) sobre el `AudioRecorder` de
 * react-native-audio-api: el mismo motor que ya reproduce el piano, así que no
 * hace falta otra librería nativa. En web lo reemplaza `microphone.web.ts`.
 *
 * Solo se usa el callback de bloques (`onAudioReady`): no se graba a archivo.
 */

/** Frecuencia pedida; el sistema puede entregar otra y el bloque la informa. */
const SAMPLE_RATE = 44100;
/**
 * 2048 muestras ≈ 46 ms: caben dos períodos de la nota más grave que se busca
 * (~75 Hz) y la respuesta sigue sintiéndose inmediata.
 */
const BUFFER_LENGTH = 2048;

let recorder: AudioRecorder | null = null;

async function requestPermission(): Promise<MicrophonePermission> {
  try {
    const permission = await AudioManager.requestRecordingPermissions();
    return permission === 'Granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

async function start(onFrame: (frame: MicrophoneFrame) => void): Promise<MicrophoneStartResult> {
  try {
    const permission = await requestPermission();
    if (permission !== 'granted') return permission;

    // iOS necesita una sesión que grabe Y reproduzca (el piano sigue sonando en
    // el mismo ejercicio); `defaultToSpeaker` evita que el audio pase al
    // auricular de llamadas al activar el micrófono. Android lo ignora.
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'measurement',
      iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP'],
    });

    recorder ??= new AudioRecorder();
    recorder.onAudioReady(
      { sampleRate: SAMPLE_RATE, bufferLength: BUFFER_LENGTH, channelCount: 1 },
      ({ buffer }) => onFrame({ samples: buffer.getChannelData(0), sampleRate: buffer.sampleRate }),
    );

    const result = await recorder.start();
    if (result.status === 'error') {
      recorder.clearOnAudioReady();
      return 'unavailable';
    }
    return 'started';
  } catch {
    return 'unavailable';
  }
}

async function stop(): Promise<void> {
  if (recorder === null) return;
  try {
    recorder.clearOnAudioReady();
    if (recorder.isRecording()) await recorder.stop();
  } catch {
    /* ya estaba detenido: nada que hacer */
  }
}

/** Instancia única: solo hay un micrófono. */
export const microphone: IMicrophone = { requestPermission, start, stop };
