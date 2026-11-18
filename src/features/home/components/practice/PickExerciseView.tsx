import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PickExercise } from '@/domain/lessons';
import { AnswerOption, AnswerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { singleNote } from './StimulusView';
import { ExerciseViewProps } from './types';

/**
 * Marcar varios sonidos (los dos que comparten nombre). Cada botón es una nota:
 * suena al tocarlo —varios a la vez suenan juntos— y cada toque lo marca o lo
 * desmarca. "Comprobar" se habilita solo con exactamente los que se piden
 * marcados. Al corregir, el parlante de cada botón se cambia por su nota.
 */
export function PickExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<PickExercise>) {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<readonly string[]>([]);

  const toggle = (id: string) => {
    if (revealed) return;
    const next = picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id];
    setPicked(next);
    onAnswer(next.length === exercise.answer.length ? { kind: 'set', ids: next } : null);
  };

  const stateOf = (id: string): AnswerOptionState => {
    const on = picked.includes(id);
    const right = exercise.answer.includes(id);
    if (!revealed) return on ? 'selected' : 'idle';
    if (on) return right ? 'correct' : 'wrong';
    return right ? 'answer' : 'idle';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      <View style={styles.row}>
        {exercise.options.map((option, index) => {
          const midi = singleNote(option.clip);
          return (
            <AnswerOption
              key={option.id}
              index={index}
              label={revealed ? option.reveal : undefined}
              labelStyle={typography.note}
              icon={revealed ? undefined : 'volume-high'}
              state={stateOf(option.id)}
              disabled={!player.ready}
              accessibilityLabel={revealed ? `${option.label}: ${option.reveal}` : option.label}
              onPressIn={() => (midi === null ? player.play(option.clip) : player.playNote(midi))}
              onPress={() => toggle(option.id)}
            />
          );
        })}
      </View>
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
