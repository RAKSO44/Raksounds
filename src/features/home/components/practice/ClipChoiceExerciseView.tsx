import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Clip, ClipChoiceExercise } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { singleNote } from './StimulusView';
import { ExerciseViewProps } from './types';

/**
 * Cada opción ES un sonido. Pulsarla la reproduce y la elige; pulsar la
 * elegida la deselecciona. Se puede escuchar tantas veces como haga falta,
 * también al corregir. Para confirmar basta con tener una opción elegida: no
 * hace falta haberlas escuchado todas.
 *
 * Si cada opción es una nota suelta (¿cuál es más agudo?), es una tecla: suena
 * al tocarla y varias suenan juntas.
 */
export function ClipChoiceExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<ClipChoiceExercise>) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const keys = exercise.options.every((option) => singleNote(option.clip) !== null);

  const choose = (id: string, clip: Clip) => {
    const midi = singleNote(clip);
    if (keys && midi !== null) {
      if (!player.ready) return;
      player.playNote(midi);
    } else {
      player.play(clip);
    }
    if (revealed) return;
    const next = selected === id ? null : id;
    setSelected(next);
    onAnswer(next === null ? null : { kind: 'option', id: next });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      {!keys && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Toca cada opción para escucharla
        </Text>
      )}

      <View style={styles.row}>
        {exercise.options.map((option, index) => (
          <AnswerOption
            key={option.id}
            index={index}
            label={option.label}
            sublabel={revealed ? option.reveal : undefined}
            icon="volume-high"
            state={answerOptionState({
              option: option.id,
              selected,
              answer: exercise.answer,
              revealed,
            })}
            disabled={!player.ready}
            accessibilityLabel={`Opción ${option.label}`}
            onPressIn={() => choose(option.id, option.clip)}
          />
        ))}
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
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
