import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceExercise, LessonOption, notationFigures, rhythmClip } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

import { NotationGlyph } from '../notation/NotationGlyph';
import { ExercisePrompt } from './ExercisePrompt';
import { StimulusView } from './StimulusView';
import { ExerciseViewProps } from './types';

/** Etiquetas de hasta este largo caben las tres en una fila. */
const SHORT_LABEL = 4;

/** Una opción que es UNA figura dibujada (caben varias en una fila). */
const isSingleFigure = (option: LessonOption) =>
  option.notation !== undefined && notationFigures(option.notation).length === 1;

/**
 * Elegir una respuesta escrita. Las opciones se pueden elegir desde el
 * principio, aunque aún no se hayan escuchado los sonidos. Una opción con
 * nota (`midi`) suena al tocarla.
 *
 * Cuando hay que reconocer de oído una nota en la escala, la pregunta va
 * DEBAJO de la escala, junto a la pista de que las barras suenan: primero se
 * escucha, luego se pregunta.
 *
 * Una opción con figuras se dibuja en vez de escribirse y suena al tocarla
 * (salvo `mutedOptions`, hasta corregir). Tras corregir sigue tocable, con
 * los colores de la corrección, para escuchar cada una.
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
  const notated = exercise.options.some((option) => option.notation !== undefined);
  const inRow = notated
    ? exercise.options.every(isSingleFigure)
    : exercise.options.every((option) => option.label.length <= SHORT_LABEL);
  const silent = exercise.mutedOptions === true && !revealed;

  const options = exercise.options.map((option, index) => {
    const { midi, notation } = option;
    const sound =
      notation !== undefined
        ? silent
          ? undefined
          : () => player.play(rhythmClip(notationFigures(notation), { pulse: true }))
        : midi === undefined
          ? undefined
          : () => player.playNote(midi);
    return (
      <AnswerOption
        key={option.id}
        index={index}
        label={notation === undefined ? option.label : undefined}
        glyph={
          notation === undefined
            ? undefined
            : (color) => (
                <NotationGlyph
                  notation={notation}
                  space={inRow ? controls.figureSpaceOption : controls.figureSpaceRow}
                  // En fila, las cabezas de las tres opciones se alinean; apiladas, cada una se centra en su botón.
                  framed={inRow}
                  color={color}
                />
              )
        }
        labelStyle={inRow ? typography.note : undefined}
        state={answerOptionState({
          option: option.id,
          selected,
          answer: exercise.answer,
          revealed,
        })}
        disabled={revealed && notation === undefined}
        accessibilityLabel={option.label}
        onPressIn={sound}
        onPress={revealed ? undefined : () => select(option.id)}
      />
    );
  });

  const prompt = <ExercisePrompt exercise={exercise} />;

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
