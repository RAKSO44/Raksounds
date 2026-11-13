import { useCallback, useEffect, useRef, useState } from 'react';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { MicrophoneFrame } from '@/domain/audio/IMicrophone';
import {
  detectPitch,
  frequencyToMidi,
  normalizedLevel,
  PitchFrame,
  rms,
  TAKE_RULES,
  takePitch,
  takeState,
} from '@/domain/pitch';
import { motion } from '@/shared/theme';
// Punto de composición con la implementación real del micrófono (nativo o web
// según la plataforma, por la extensión `.web.ts`).
import { microphone } from '@/infrastructure/audio/microphone';

/**
 * - `idle`: micrófono cerrado.
 * - `starting`: pidiendo permiso / abriendo el micrófono.
 * - `listening`: llegan bloques de audio.
 */
export type TakeStatus = 'idle' | 'starting' | 'listening';

/**
 * Por qué la última toma no dio resultado: sin permiso, sin micrófono, o el
 * usuario no cantó (o cantó demasiado poco).
 */
export type TakeProblem = 'denied' | 'unavailable' | 'silent';

export interface SingingTake {
  status: TakeStatus;
  /** Problema de la última toma; se limpia al empezar otra. */
  problem: TakeProblem | null;
  /** Volumen en [0, 1] para las barras del micrófono. */
  level: SharedValue<number>;
  /** Abre el micrófono. La toma se cierra sola cuando el usuario calla. */
  start: () => void;
  /** Cierra la toma ya y califica lo que se haya cantado. */
  finish: () => void;
  /** Olvida el problema de la última toma (p. ej. al cerrar el aviso de permiso). */
  clearProblem: () => void;
}

/**
 * Una toma de voz: abre el micrófono, convierte cada bloque en un cuadro de
 * altura (`domain/pitch`) y decide con las reglas del dominio cuándo terminó.
 * Al terminar con voz suficiente entrega la altura cantada a `onSung`.
 *
 * El hook solo orquesta: qué es "voz", cuándo se cierra la toma y qué altura se
 * cantó lo decide el dominio.
 */
export function useSingingTake(onSung: (midi: number) => void): SingingTake {
  const [status, setStatus] = useState<TakeStatus>('idle');
  const [problem, setProblem] = useState<TakeProblem | null>(null);
  const level = useSharedValue(0);

  // Se guardan en refs porque llegan ~20 bloques por segundo: nada de esto
  // debe repintar React (las barras se mueven por el valor animado).
  const frames = useRef<PitchFrame[]>([]);
  const elapsedMs = useRef(0);
  const active = useRef(false);
  const onSungRef = useRef(onSung);
  useEffect(() => {
    onSungRef.current = onSung;
  }, [onSung]);

  const close = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    microphone.stop();
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    level.value = withTiming(0, { duration: motion.micLevel });
    setStatus('idle');

    const sung = takePitch(frames.current);
    if (sung === null) setProblem('silent');
    else onSungRef.current(sung);
  }, [level]);

  const handleFrame = useCallback(
    ({ samples, sampleRate }: MicrophoneFrame) => {
      if (!active.current) return;
      const durationMs = (samples.length / sampleRate) * 1000;
      elapsedMs.current += durationMs;

      const estimate =
        elapsedMs.current <= TAKE_RULES.warmupMs ? null : detectPitch(samples, sampleRate);
      frames.current.push({
        timeMs: elapsedMs.current,
        durationMs,
        midi: estimate === null ? null : frequencyToMidi(estimate.frequency),
      });
      // eslint-disable-next-line react-hooks/immutability -- ídem
      level.value = withTiming(normalizedLevel(rms(samples)), { duration: motion.micLevel });
      setStatus('listening');

      const state = takeState(frames.current);
      if (state === 'finished' || state === 'silent') close();
    },
    [level, close],
  );

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    frames.current = [];
    elapsedMs.current = 0;
    setProblem(null);
    setStatus('starting');

    microphone.start(handleFrame).then((result) => {
      if (result === 'started') return;
      active.current = false;
      setStatus('idle');
      setProblem(result);
    });
  }, [handleFrame]);

  // Salir del ejercicio con el micrófono abierto no debe dejarlo escuchando.
  useEffect(
    () => () => {
      active.current = false;
      microphone.stop();
    },
    [],
  );

  const clearProblem = useCallback(() => setProblem(null), []);

  return { status, problem, level, start, finish: close, clearProblem };
}
