import { StyleSheet, Text, View } from 'react-native';

import { Exercise, IntervalId, midiAtInterval, noteAtInterval } from '@/domain/ear-training';
import { spacing, typography, useTheme } from '@/shared/theme';

import { intervalNumberLabel, intervalQualityLabel } from '../labels';
import { useNoteFormatter } from '../hooks/useNoteFormatter';
import { NotePlayer } from '../hooks/useNotePlayer';
import { AnswerOption, answerOptionState } from './AnswerOption';
import { NoteKey } from './NoteKey';

/** Texto de la tecla oculta mientras no se corrige el ejercicio. */
const HIDDEN_NOTE = '?';

interface IntervalExerciseProps {
  exercise: Exercise;
  selected: IntervalId | null;
  revealed: boolean;
  player: NotePlayer;
  onSelect: (interval: IntervalId) => void;
}

/**
 * Ejercicio de identificación de intervalo: suenan la nota base (visible) y la
 * nota a adivinar (oculta), y hay que decir qué intervalo forman. Las dos
 * teclas se pueden pulsar cuantas veces haga falta, antes y después de
 * corregir.
 */
export function IntervalExercise({
  exercise,
  selected,
  revealed,
  player,
  onSelect,
}: IntervalExerciseProps) {
  const { colors } = useTheme();
  const format = useNoteFormatter();

  const rootLabel = format({ name: exercise.root, octave: exercise.rootOctave });
  const targetNote = noteAtInterval(exercise.root, exercise.rootOctave, exercise.answer);
  const targetLabel = revealed && targetNote !== null ? format(targetNote) : HIDDEN_NOTE;

  return (
    <View style={styles.container}>
      <View style={styles.keys}>
        <NoteKey
          label={rootLabel}
          caption="Nota base"
          tone="brand"
          disabled={!player.ready}
          accessibilityLabel={`Nota base ${rootLabel}`}
          onPress={() => player.press('root', exercise.rootMidi)}
          onRelease={() => player.release('root')}
        />
        <NoteKey
          label={targetLabel}
          caption="Nota a adivinar"
          tone="secondary"
          disabled={!player.ready}
          accessibilityLabel="Nota a adivinar"
          onPress={() => player.press('target', midiAtInterval(exercise, exercise.answer))}
          onRelease={() => player.release('target')}
        />
      </View>

      <Text style={[styles.question, { color: colors.textPrimary }]}>¿Qué intervalo forman?</Text>

      <View style={styles.options}>
        {exercise.options.map((option, index) => (
          <AnswerOption
            key={option}
            index={index}
            label={intervalNumberLabel(option)}
            sublabel={intervalQualityLabel(option)}
            state={answerOptionState({ option, selected, answer: exercise.answer, revealed })}
            accessibilityLabel={`${intervalNumberLabel(option)} ${intervalQualityLabel(option)}`}
            onPress={() => onSelect(option)}
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
  keys: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  question: {
    ...typography.question,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
