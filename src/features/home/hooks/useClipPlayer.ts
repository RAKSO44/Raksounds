import { useCallback, useEffect, useRef, useState } from 'react';

import { NO_VOICE, VoiceHandle } from '@/domain/audio';
import { Clip, CLIP_NOTE_MS, clipDurationMs, clipEventTimes } from '@/domain/lessons';
// Punto de composición con los motores reales: el piano (notas) y el
// metrónomo (golpes con precisión de muestra), que comparten reloj de audio.
import { audioClock } from '@/infrastructure/audio/audioEngine';
import { metronome } from '@/infrastructure/audio/metronome';
import { pianoPlayer } from '@/infrastructure/audio/pianoPlayer';

export interface ClipHandlers {
  /** Se llama en cada evento del clip (nota o golpe), con su índice. */
  onEvent?: (index: number) => void;
  /** Se llama al terminar el clip (no si se corta antes). */
  onEnd?: () => void;
}

export interface ClipPlayer {
  /** false hasta que las muestras del piano terminan de cargar. */
  ready: boolean;
  /**
   * Corta lo que sonara y reproduce el clip. Devuelve el instante del evento 0
   * en el reloj de `performance.now()` (la referencia para calificar toques), o
   * `null` si el audio no está listo y no sonó nada.
   */
  play: (clip: Clip, handlers?: ClipHandlers) => number | null;
  /**
   * Hace sonar UNA nota sin cortar nada: es una tecla. Varias pulsadas a la
   * vez suenan juntas (regla de toda tecla que suena en pantalla).
   */
  playNote: (midi: number) => void;
  stop: () => void;
}

/**
 * Reproductor de los estímulos de una lección. Un clip es dato del dominio
 * (`domain/lessons/clip.ts`); aquí se decide qué motor lo hace sonar y se
 * avisa a la UI de cada evento para que la ficha se encienda a la vez que el
 * sonido.
 *
 * Solo hay un clip sonando a la vez: reproducir otro corta el anterior, y
 * salir de la pantalla corta todo (no quedan metrónomos sonando de fondo).
 * Las notas sueltas (`playNote`) son la excepción: son teclas y se suman.
 */
export function useClipPlayer(): ClipPlayer {
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voices = useRef<VoiceHandle[]>([]);
  const keys = useRef(new Set<VoiceHandle>());
  const keyTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let mounted = true;
    Promise.all([pianoPlayer.load(), metronome.load()]).then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    metronome.stop();
    voices.current.forEach((voice) => pianoPlayer.noteOff(voice));
    voices.current = [];
  }, []);

  const at = useCallback((delayMs: number, action: () => void) => {
    timers.current.push(setTimeout(action, Math.max(0, delayMs)));
  }, []);

  const play = useCallback(
    (clip: Clip, handlers: ClipHandlers = {}) => {
      stop();
      if (!ready) return null;

      let start: number | null;
      if (clip.kind === 'pulse') {
        start = metronome.play(clip.onsetsMs)?.startMs ?? null;
      } else if (clip.kind === 'rhythm') {
        // La duración es el contenido: todo se programa de una vez en el reloj
        // de audio, cada nota con su duración exacta. Con pulso de fondo, las
        // notas se programan en el instante del primer golpe y en el MISMO
        // reloj que él: así cada nota cae justo encima de su golpe.
        const pulse = clip.pulseOnsetsMs === undefined ? null : metronome.play(clip.pulseOnsetsMs);
        start = pulse?.startMs ?? performance.now();
        const startAt = pulse?.atMs ?? audioClock.now();
        for (const note of clip.notes) {
          const voice = pianoPlayer.playTimed(note.midi, startAt + note.atMs, note.durationMs);
          if (voice !== NO_VOICE) voices.current.push(voice);
        }
      } else {
        start = performance.now();
        for (const note of clip.notes) {
          at(note.atMs, () => {
            const voice = pianoPlayer.noteOn(note.midi);
            if (voice === NO_VOICE) return;
            voices.current.push(voice);
            at(note.durationMs, () => pianoPlayer.noteOff(voice));
          });
        }
      }
      if (start === null) return null;

      // La UI se sincroniza con el MISMO instante de referencia que el audio.
      const offset = start - performance.now();
      clipEventTimes(clip).forEach((time, index) => {
        at(offset + time, () => handlers.onEvent?.(index));
      });
      at(offset + clipDurationMs(clip), () => handlers.onEnd?.());
      return start;
    },
    [ready, stop, at],
  );

  const playNote = useCallback(
    (midi: number) => {
      if (!ready) return;
      const voice = pianoPlayer.noteOn(midi);
      if (voice === NO_VOICE) return;
      keys.current.add(voice);
      const timer = setTimeout(() => {
        keyTimers.current.delete(timer);
        keys.current.delete(voice);
        pianoPlayer.noteOff(voice);
      }, CLIP_NOTE_MS);
      keyTimers.current.add(timer);
    },
    [ready],
  );

  // Al salir de la pantalla no debe quedar nada sonando.
  useEffect(() => stop, [stop]);
  useEffect(() => {
    const sounding = keys.current;
    const pending = keyTimers.current;
    return () => {
      pending.forEach(clearTimeout);
      sounding.forEach((voice) => pianoPlayer.noteOff(voice));
    };
  }, []);

  return { ready, play, playNote, stop };
}
