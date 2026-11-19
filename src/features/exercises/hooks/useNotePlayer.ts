import { useCallback, useEffect, useRef, useState } from 'react';

import { VoiceHandle } from '@/domain/audio';
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
  /**
   * Como `press`, pero la tecla hace sonar VARIAS notas a la vez (un acorde).
   * Se sueltan juntas con `release(key)`.
   */
  pressChord: (key: string, midis: readonly number[]) => void;
  /** El dedo suelta la tecla (o el gesto se cancela). */
  release: (key: string) => void;
  /**
   * Suelta todo lo que esté sonando. Se usa antes de abrir el micrófono: el
   * piano no debe colarse en la toma como si fuera la voz.
   */
  silence: () => void;
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

  // Voces sonando por cada tecla pulsada (una tecla de acorde tiene varias).
  // Es un ref y no estado porque sonar una nota no repinta nada, y varias
  // teclas pueden estar pulsadas a la vez.
  const heldVoices = useRef(new Map<string, readonly VoiceHandle[]>());

  const pressChord = useCallback(
    (key: string, midis: readonly number[]) => {
      if (!ready) return;
      const held = heldVoices.current;
      // Defensa por si un press-out se perdiera: sin esto las voces anteriores
      // quedarían sonando hasta agotar la muestra.
      held.get(key)?.forEach((voice) => pianoPlayer.noteOff(voice));

      held.set(
        key,
        midis.map((midi) => pianoPlayer.noteOn(midi)),
      );
    },
    [ready],
  );

  const press = useCallback((key: string, midi: number) => pressChord(key, [midi]), [pressChord]);

  const release = useCallback((key: string) => {
    const held = heldVoices.current;
    const voices = held.get(key);
    if (voices === undefined) return;
    held.delete(key);
    voices.forEach((voice) => pianoPlayer.noteOff(voice));
  }, []);

  const silence = useCallback(() => {
    heldVoices.current.clear();
    pianoPlayer.stopAll();
  }, []);

  // Al salir del ejercicio no debe quedar ninguna nota colgada.
  useEffect(() => {
    const held = heldVoices.current;
    return () => {
      held.clear();
      pianoPlayer.stopAll();
    };
  }, []);

  return { ready, press, pressChord, release, silence };
}
