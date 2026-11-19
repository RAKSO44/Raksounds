import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceExercise } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { StimulusView } from './StimulusView';
import { ExerciseViewProps } from './types';

/** Etiquetas de hasta este largo caben las tres en una fila. */
const SHORT_LABEL = 4;

/**
 * Elegir una respuesta escrita. Las opciones se pueden elegir desde el
 * principio, aunque aún no se hayan escuchado los sonidos. Una opción con
 * nota (`midi`) suena al tocarla.
 *
 * Cuando hay que reconocer de oído una nota en la escala, la pregunta va
 * DEBAJO de la escala, junto a la pista de que las barras suenan: primero se
 * escucha, luego se pregunta.
 */
export function ChoiceExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<ChoiceExercise>) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const select = (id: string) => {
    setSelected(id);
    onAnswer({ kind: 'option', id });
  };

  const stimulus = exercise.stimulus;
  const byEar = stimulus?.kind === 'steps' && stimulus.listen !== null;
  const inRow = exercise.options.every((option) => option.label.length <= SHORT_LABEL);
  const options = exercise.options.map((option, index) => {
    const midi = option.midi;
    return (
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
        disabled={revealed}
        accessibilityLabel={option.label}
        onPressIn={midi === undefined ? undefined : () => player.playNote(midi)}
        onPress={() => select(option.id)}
      />
    );
  });

  const prompt = (
    <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>
  );

  return (
    <View style={styles.container}>
      {!byEar && prompt}

      {stimulus !== null && (
        <StimulusView
          stimulus={stimulus}
          player={player}
          solution={exercise.options.find((o) => o.id === exercise.answer)?.label ?? null}
          revealed={revealed}
        />
      )}

      {byEar && (
        <View style={styles.askBlock}>
          {prompt}
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Tip: presiona las barras para escuchar las notas
          </Text>
        </View>
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
  askBlock: {
    gap: spacing.xs,
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
