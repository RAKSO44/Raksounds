import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AnswerRecord,
  createRound,
  Exercise,
  ExerciseLevel,
  ExerciseMode,
  IntervalId,
  RoundSummary,
  summarizeRound,
} from '@/domain/ear-training';
import { hapticError, hapticSuccess } from '@/shared/haptics';

/**
 * Estado de una ronda de ejercicios.
 *
 * - `answering`: el usuario puede sonar notas y elegir opción.
 * - `revealed`: ya confirmó; se ve la corrección y el botón dice "Continuar".
 * - `summary`: se acabaron los ejercicios y se muestra el resumen.
 */
export type RoundPhase = 'answering' | 'revealed' | 'summary';

export interface ExerciseRound {
  /** Ejercicio en curso, o `null` cuando la ronda ya terminó. */
  exercise: Exercise | null;
  /** Posición del ejercicio actual (0-based). */
  index: number;
  total: number;
  phase: RoundPhase;
  /** Opción marcada por el usuario; `null` mientras no elija ninguna. */
  selected: IntervalId | null;
  /** Solo tiene valor en `revealed`. */
  isCorrect: boolean | null;
  /** Solo tiene valor en `summary`. */
  summary: RoundSummary | null;
  select: (interval: IntervalId) => void;
  /**
   * Registra que sonó una nota del ejercicio en curso, identificada por la
   * tecla que la disparó. La PRIMERA vez que suena cada tecla no cuenta (oír
   * cada nota una vez es el ejercicio); a partir de ahí cuenta como repetición,
   * que es lo que el resumen promedia.
   */
  registerListen: (key: string) => void;
  /** Corrige la respuesta elegida. No hace nada sin selección. */
  confirm: () => void;
  /** Pasa al siguiente ejercicio o, si era el último, al resumen. */
  advance: () => void;
}

interface RoundOptions {
  readonly mode: ExerciseMode;
  readonly level: ExerciseLevel;
}

export function useExerciseRound({ mode, level }: RoundOptions): ExerciseRound {
  // La ronda se genera UNA vez: el usuario no debe ver cambiar las preguntas
  // por un repintado. `Math.random` entra aquí, en la capa de composición, para
  // que el generador del dominio siga siendo puro.
  const [exercises] = useState(() => createRound({ mode, level, random: Math.random }));

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('answering');
  const [selected, setSelected] = useState<IntervalId | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);

  // Las respuestas no se pintan hasta el resumen, así que viven en un ref.
  const answers = useRef<AnswerRecord[]>([]);
  // Cuándo apareció el ejercicio actual. Se sella en un efecto (no durante el
  // render) porque leer el reloj al renderizar daría un tiempo distinto en cada
  // repintado; además así el cronómetro se reinicia solo al cambiar de
  // ejercicio, incluido el primero.
  const startedAt = useRef(0);
  // Repeticiones del ejercicio en curso y teclas ya oídas en él. Son refs por
  // lo mismo que las respuestas: sonar una nota no repinta nada.
  const replays = useRef(0);
  const heard = useRef(new Set<string>());
  useEffect(() => {
    startedAt.current = Date.now();
    replays.current = 0;
    heard.current.clear();
  }, [index]);

  const exercise = exercises[index] ?? null;
  const isCorrect = phase === 'revealed' && exercise !== null ? selected === exercise.answer : null;

  const select = useCallback(
    (interval: IntervalId) => {
      // Elegir después de confirmar no debe alterar la corrección ya mostrada.
      if (phase !== 'answering') return;
      setSelected(interval);
    },
    [phase],
  );

  const registerListen = useCallback((key: string) => {
    if (heard.current.has(key)) replays.current += 1;
    else heard.current.add(key);
  }, []);

  const confirm = useCallback(() => {
    if (phase !== 'answering' || selected === null || exercise === null) return;

    answers.current.push({
      kind: exercise.kind,
      answer: exercise.answer,
      chosen: selected,
      elapsedMs: Date.now() - startedAt.current,
      replayCount: replays.current,
    });

    if (selected === exercise.answer) hapticSuccess();
    else hapticError();

    setPhase('revealed');
  }, [phase, selected, exercise]);

  const advance = useCallback(() => {
    if (phase !== 'revealed') return;

    if (index + 1 >= exercises.length) {
      setSummary(summarizeRound(answers.current));
      setPhase('summary');
      return;
    }

    setIndex(index + 1);
    setSelected(null);
    setPhase('answering');
  }, [phase, index, exercises.length]);

  return {
    exercise: phase === 'summary' ? null : exercise,
    index,
    total: exercises.length,
    phase,
    selected,
    isCorrect,
    summary,
    select,
    registerListen,
    confirm,
    advance,
  };
}
