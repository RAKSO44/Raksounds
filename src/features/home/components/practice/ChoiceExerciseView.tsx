import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceExercise, stimulusClips } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { StimulusView } from './StimulusView';
import { ExerciseViewProps } from './types';

/** Etiquetas de hasta este largo caben las tres en una fila. */
const SHORT_LABEL = 4;

/**
 * Elegir una respuesta escrita. Si el ejercicio trae sonidos, las opciones se
 * habilitan al terminar de escucharlos: no se responde a algo que no sonó.
 */
export function ChoiceExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<ChoiceExercise>) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [heard, setHeard] = useState(stimulusClips(exercise).length === 0);
  const markHeard = useCallback(() => setHeard(true), []);

  const select = (id: string) => {
    setSelected(id);
    onAnswer({ kind: 'option', id });
  };

  const inRow = exercise.options.every((option) => option.label.length <= SHORT_LABEL);
  const options = exercise.options.map((option, index) => (
    <AnswerOption
      key={option.id}
      index={index}
      label={option.label}
      labelStyle={inRow ? typography.note : undefined}
      state={answerOptionState({
        option: option.id,
        selected,
        answer: exercise.answer,
        revealed,
      })}
      disabled={!heard || revealed}
      accessibilityLabel={option.label}
      onPress={() => select(option.id)}
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      {exercise.stimulus !== null && (
        <StimulusView
          stimulus={exercise.stimulus}
          player={player}
          solution={exercise.options.find((o) => o.id === exercise.answer)?.label ?? null}
          revealed={revealed}
          onHeard={markHeard}
        />
      )}

      {!heard && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Escucha antes de responder
        </Text>
      )}

      {inRow ? (
        <View style={styles.row}>{options}</View>
      ) : (
        <View style={styles.column}>
          {options.map((option) => (
            <View key={option.key} style={styles.row}>
              {option}
            </View>
          ))}
        </View>
      )}
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
  column: {
    gap: spacing.sm,
  },
});
