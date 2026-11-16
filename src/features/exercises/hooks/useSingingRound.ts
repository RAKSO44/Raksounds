import { useCallback, useEffect, useRef, useState } from 'react';

import { countReplays } from '@/domain/ear-training';
import {
  createSingingRound,
  evaluateSinging,
  SingingEvaluation,
  SingingExercise,
  SingingKind,
  SingingRecord,
  singingScore,
  singingTargetOf,
  SingingSummary,
  summarizeSingingRound,
} from '@/domain/singing';
import { hapticError, hapticSuccess } from '@/shared/haptics';

import { useSoundEffects } from './useSoundEffects';

/**
 * - `answering`: se puede escuchar la referencia y cantar.
 * - `revealed`: la toma ya se calificó; el botón de abajo dice "Continuar".
 * - `summary`: terminó la ronda.
 *
 * A diferencia de la identificación no hay paso de "Confirmar": la respuesta es
 * la propia toma, y se califica en cuanto el usuario deja de cantar (como en
 * los ejercicios de hablar de Duolingo).
 */
export type SingingPhase = 'answering' | 'revealed' | 'summary';

export interface SingingRound {
  exercise: SingingExercise | null;
  index: number;
  total: number;
  phase: SingingPhase;
  /** Solo tiene valor en `revealed`. */
  evaluation: SingingEvaluation | null;
  /** Solo tiene valor en `summary`. */
  summary: SingingSummary | null;
  /** Registra que sonó una tecla del ejercicio (ver `countReplays`). */
  registerListen: (key: string) => void;
  /** Califica la altura cantada (MIDI continuo). */
  submit: (sungMidi: number) => void;
  /** Pasa al siguiente ejercicio o, si era el último, al resumen. */
  advance: () => void;
}

interface RoundOptions {
  readonly kind: SingingKind;
  readonly levelNumber: number;
}

export function useSingingRound({ kind, levelNumber }: RoundOptions): SingingRound {
  // Se genera UNA vez; `Math.random` entra aquí para que el dominio siga puro.
  const [exercises] = useState(() =>
    createSingingRound({ kind, levelNumber, random: Math.random }),
  );

  const playEffect = useSoundEffects();

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<SingingPhase>('answering');
  const [evaluation, setEvaluation] = useState<SingingEvaluation | null>(null);
  const [summary, setSummary] = useState<SingingSummary | null>(null);

  const records = useRef<SingingRecord[]>([]);
  const startedAt = useRef(0);
  const listened = useRef<string[]>([]);
  useEffect(() => {
    startedAt.current = Date.now();
    listened.current = [];
  }, [index]);

  const exercise = exercises[index] ?? null;

  const registerListen = useCallback((key: string) => {
    listened.current.push(key);
  }, []);

  const submit = useCallback(
    (sungMidi: number) => {
      if (phase !== 'answering' || exercise === null) return;
      const result = evaluateSinging(exercise, sungMidi);

      records.current.push({
        target: singingTargetOf(exercise),
        verdict: result.verdict,
        centsOff: result.centsOff,
        elapsedMs: Date.now() - startedAt.current,
        replayCount: countReplays(listened.current),
      });

      // Un "casi" suma medio punto: dio con la nota, así que suena a acierto.
      if (singingScore(result.verdict) > 0) {
        hapticSuccess();
        playEffect('success');
      } else {
        hapticError();
        playEffect('error');
      }

      setEvaluation(result);
      setPhase('revealed');
    },
    [phase, exercise, playEffect],
  );

  const advance = useCallback(() => {
    if (phase !== 'revealed') return;

    if (index + 1 >= exercises.length) {
      setSummary(summarizeSingingRound(records.current));
      setPhase('summary');
      return;
    }

    setIndex(index + 1);
    setEvaluation(null);
    setPhase('answering');
  }, [phase, index, exercises.length]);

  return {
    exercise: phase === 'summary' ? null : exercise,
    index,
    total: exercises.length,
    phase,
    evaluation,
    summary,
    registerListen,
    submit,
    advance,
  };
}
