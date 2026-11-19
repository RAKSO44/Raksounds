import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { judgeTapsOnPulse, TapExercise, TapJudgement } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

import { useMetronomes } from '../../hooks/useMetronomes';
import { BeatMarks } from '../BeatMarks';
import { Metronome } from '../Metronome';
import { ExerciseViewProps } from './types';

/** El único metrónomo del ejercicio. */
const PULSE = 'pulse';

/**
 * Tocar con el pulso. El metrónomo arranca solo y NO se apaga mientras dure
 * el ejercicio: se empieza a tocar cuando se quiere y cuenta desde el primer
 * toque. Cada toque pinta su punto; con el último, TAP se bloquea, se
 * califica (golpes seguidos, `judgeTapsOnPulse`) y "Comprobar" se habilita.
 * Al corregir, cada punto toma el color de cómo cayó su toque.
 */
export function TapExerciseView({ exercise, revealed, onAnswer }: ExerciseViewProps<TapExercise>) {
  const { colors } = useTheme();
  const metronomes = useMetronomes();
  const [count, setCount] = useState(0);
  const [judgement, setJudgement] = useState<TapJudgement | null>(null);
  // Los instantes van en una ref: dos toques en el mismo fotograma no deben
  // leer una lista vieja.
  const taps = useRef<number[]>([]);

  const { ready, start } = metronomes;
  useEffect(() => {
    if (ready) start(PULSE, exercise.bpm);
  }, [ready, start, exercise.bpm]);

  const startMs = metronomes.startMs;
  const done = count >= exercise.taps;

  const tap = () => {
    const now = performance.now();
    if (startMs === null || taps.current.length >= exercise.taps) return;
    taps.current = [...taps.current, now];
    setCount(taps.current.length);
    if (taps.current.length < exercise.taps) return;
    const result = judgeTapsOnPulse(startMs, exercise.bpm, taps.current);
    setJudgement(result);
    onAnswer({ kind: 'tap', passed: result.passed });
  };

  const status =
    revealed && judgement !== null
      ? `Acertaste ${judgement.hits} de ${exercise.taps} toques.`
      : count === 0
        ? `Empieza cuando quieras: toca ${exercise.taps} veces, una con cada golpe.`
        : ' ';

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      <View style={styles.center}>
        <Metronome
          running={metronomes.active !== null}
          bpm={exercise.bpm}
          beat={metronomes.beat}
          plate={String(exercise.bpm)}
          weightBpm={exercise.bpm}
          accessibilityLabel={`Metrónomo a ${exercise.bpm} BPM`}
        />
      </View>

      <BeatMarks
        count={exercise.taps}
        filled={count}
        grades={revealed ? judgement?.beats.map((beat) => beat.grade) : null}
      />

      <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text>

      <PushButton
        variant="solid"
        tone="secondary"
        label="TAP"
        icon="gesture-tap"
        iconPlacement="start"
        labelStyle={styles.tapLabel}
        minWidth={controls.tapButtonMinWidth}
        // El botón se ajusta a su contenido (alignSelf propio): se centra él.
        style={styles.tap}
        disabled={done || startMs === null}
        accessibilityLabel="Tocar con el pulso"
        // Al TOCAR, no al soltar: soltar llega decenas de ms tarde.
        onPressIn={tap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  prompt: {
    ...typography.question,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
  },
  tap: {
    alignSelf: 'center',
  },
  tapLabel: {
    ...typography.title,
    transform: [{ translateY: controls.capsLabelDrop }],
  },
  status: {
    ...typography.subtitle,
    textAlign: 'center',
  },
});
