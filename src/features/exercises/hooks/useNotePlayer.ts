import { useCallback, useEffect, useRef, useState } from 'react';

import { VoiceHandle } from '@/domain/audio/IAudioPlayer';
// Punto de composición con la implementación real de audio: el motor es el
// mismo singleton que usa la Librería, así que las muestras ya suelen estar
// cargadas al entrar a un ejercicio.
import { pianoPlayer } from '@/infrastructure/audio/pianoPlayer';

export interface NotePlayer {
  /** false hasta que las muestras terminan de precargar. */
  ready: boolean;
  /**
   * El dedo toca una tecla: la nota empieza a sonar. `key` identifica a la
   * tecla (no a la altura), de modo que dos teclas distintas con la misma nota
   * se sueltan por separado y volver a pulsar la misma tecla siempre suena.
   */
  press: (key: string, midi: number) => void;
  /** El dedo suelta la tecla (o el gesto se cancela). */
  release: (key: string) => void;
}

/**
 * Reproductor de notas sueltas para los ejercicios. Es el equivalente de
 * `useScalePlayer` en la Librería, pero sin escala: aquí las alturas las decide
 * el ejercicio, no una fórmula.
 */
export function useNotePlayer(): NotePlayer {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    pianoPlayer.load().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Voz sonando por cada tecla pulsada. Es un ref y no estado porque sonar una
  // nota no repinta nada, y varias teclas pueden estar pulsadas a la vez.
  const heldVoices = useRef(new Map<string, VoiceHandle>());

  const press = useCallback(
    (key: string, midi: number) => {
      if (!ready) return;
      const held = heldVoices.current;
      // Defensa por si un press-out se perdiera: sin esto la voz anterior
      // quedaría sonando hasta agotar la muestra.
      const previous = held.get(key);
      if (previous !== undefined) pianoPlayer.noteOff(previous);

      held.set(key, pianoPlayer.noteOn(midi));
    },
    [ready],
  );

  const release = useCallback((key: string) => {
    const held = heldVoices.current;
    const voice = held.get(key);
    if (voice === undefined) return;
    held.delete(key);
    pianoPlayer.noteOff(voice);
  }, []);

  // Al salir del ejercicio no debe quedar ninguna nota colgada.
  useEffect(() => {
    const held = heldVoices.current;
    return () => {
      held.clear();
      pianoPlayer.stopAll();
    };
  }, []);

  return { ready, press, release };
}
