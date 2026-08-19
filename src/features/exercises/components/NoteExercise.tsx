import { StyleSheet, Text, View } from 'react-native';

import { Exercise, IntervalId, midiAtInterval, noteAtInterval } from '@/domain/ear-training';
import { spacing, typography, useTheme } from '@/shared/theme';

import { noteQuestionLabel, optionLetter } from '../labels';
import { useNoteFormatter } from '../hooks/useNoteFormatter';
import { NotePlayer } from '../hooks/useNotePlayer';
import { AnswerOption, answerOptionState } from './AnswerOption';
import { NoteKey } from './NoteKey';

interface NoteExerciseProps {
  exercise: Exercise;
  selected: IntervalId | null;
  revealed: boolean;
  player: NotePlayer;
  onSelect: (interval: IntervalId) => void;
}

/**
 * Ejercicio de identificación de nota: se oye la base y hay que encontrar cuál
 * de las tres candidatas está al intervalo pedido.
 *
 * Las opciones NO muestran su nota ni una letra que las nombre: son sonido, y
 * lo único que llevan es el altavoz. Pulsar una la hace sonar y la selecciona a
 * la vez —y volver a pulsar la ya elegida vuelve a sonar, tantas veces como
 * haga falta—, porque comparar de oído es justamente el ejercicio. Al corregir,
 * la nota SUSTITUYE al altavoz: el botón deja de ser sonido y pasa a ser dato.
 */
export function NoteExercise({
  exercise,
  selected,
  revealed,
  player,
  onSelect,
}: NoteExerciseProps) {
  const { colors } = useTheme();
  const format = useNoteFormatter();

  const rootLabel = format({ name: exercise.root, octave: exercise.rootOctave });

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
      </View>

      <Text style={[styles.question, { color: colors.textPrimary }]}>
        {noteQuestionLabel(exercise.answer)}
      </Text>

      <View style={styles.options}>
        {exercise.options.map((option, index) => {
          const letter = optionLetter(index);
          const note = noteAtInterval(exercise.root, exercise.rootOctave, option);
          const voiceKey = `option-${index}`;

          return (
            <AnswerOption
              key={option}
              index={index}
              // Antes de corregir solo hay altavoz; después, solo la nota.
              icon={revealed ? undefined : 'volume-high'}
              label={revealed && note !== null ? format(note) : undefined}
              labelStyle={typography.note}
              state={answerOptionState({ option, selected, answer: exercise.answer, revealed })}
              accessibilityLabel={`Opción ${letter}`}
              disabled={!player.ready}
              // El sonido va en el press-in (como una tecla) y la selección con
              // él: esperar al soltado haría que la opción se sintiera lenta.
              onPressIn={() => {
                player.press(voiceKey, midiAtInterval(exercise, option));
                onSelect(option);
              }}
              onPressOut={() => player.release(voiceKey)}
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
  keys: {
    alignItems: 'center',
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
