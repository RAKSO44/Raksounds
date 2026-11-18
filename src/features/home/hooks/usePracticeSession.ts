import { useCallback, useMemo, useState } from 'react';

import {
  generatePractice,
  generateRetry,
  isAnswerCorrect,
  LessonAnswer,
  LessonExercise,
  ModuleId,
} from '@/domain/lessons';

import { useLessonSounds } from './useLessonSounds';

export type PracticePhase = 'answering' | 'revealed';

export interface PracticeSession {
  exercises: readonly LessonExercise[];
  index: number;
  exercise: LessonExercise | null;
  phase: PracticePhase;
  /** Respuesta lista para corregir (la entrega la vista del ejercicio). */
  answer: LessonAnswer | null;
  /** Resultado del ejercicio en pantalla, tras corregir. */
  isCorrect: boolean | null;
  /** Aciertos acumulados. */
  score: number;
  /** Aciertos finales; `null` hasta responder el último. */
  finalScore: number | null;
  /** Posiciones de la plantilla falladas en esta tanda (para reintentarlas). */
  failed: readonly number[];
  setAnswer: (answer: LessonAnswer | null) => void;
  confirm: () => void;
  advance: () => void;
}

/**
 * Un intento de práctica: 15 ejercicios generados de una semilla al empezar.
 * Las preguntas no se regeneran mientras la pantalla vive: repintar no cambia
 * el ejercicio en curso. Qué es correcto lo decide el dominio
 * (`isAnswerCorrect`); aquí solo se avanza.
 */
export function usePracticeSession(
  moduleId: ModuleId,
  seed: number,
  /** Solo estas posiciones ("Reintentar fallos"); `null` = el intento entero. */
  retry: readonly number[] | null = null,
): PracticeSession {
  const exercises = useMemo(
    () =>
      retry === null ? generatePractice(moduleId, seed) : generateRetry(moduleId, seed, retry),
    [moduleId, seed, retry],
  );
  const playEffect = useLessonSounds();

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('answering');
  const [answer, setAnswerState] = useState<LessonAnswer | null>(null);
  const [results, setResults] = useState<readonly boolean[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const exercise = exercises[index] ?? null;
  const isCorrect = phase === 'revealed' ? (results[index] ?? null) : null;
  const score = results.filter(Boolean).length;
  const failed = useMemo(
    () => exercises.filter((_, i) => results[i] === false).map((e) => e.position),
    [exercises, results],
  );

  const setAnswer = useCallback(
    (next: LessonAnswer | null) => {
      if (phase === 'answering') setAnswerState(next);
    },
    [phase],
  );

  const confirm = useCallback(() => {
    if (exercise === null || answer === null || phase !== 'answering') return;
    const correct = isAnswerCorrect(exercise, answer);
    setResults((previous) => [...previous, correct]);
    setPhase('revealed');
    playEffect(correct ? 'success' : 'error');
  }, [exercise, answer, phase, playEffect]);

  const advance = useCallback(() => {
    if (phase !== 'revealed') return;
    if (index + 1 >= exercises.length) {
      setFinalScore(results.filter(Boolean).length);
      return;
    }
    setIndex(index + 1);
    setAnswerState(null);
    setPhase('answering');
  }, [phase, index, exercises.length, results]);

  return {
    exercises,
    index,
    exercise,
    phase,
    answer,
    isCorrect,
    score,
    finalScore,
    failed,
    setAnswer,
    confirm,
    advance,
  };
}
