import { StyleSheet, Text, View } from 'react-native';

import { chordSymbol, SingingExercise } from '@/domain/singing';
import { spacing, typography, useTheme } from '@/shared/theme';

import { chordKeyCaption, singingQuestionLabel } from '../labels';
import { useNoteFormatter } from '../hooks/useNoteFormatter';
import { NotePlayer } from '../hooks/useNotePlayer';
import { ChordKeyboard } from './ChordKeyboard';
import { NoteKey } from './NoteKey';

interface SingingExerciseViewProps {
  exercise: SingingExercise;
  /** Ya se calificó: aparece la tecla con la nota que había que cantar. */
  revealed: boolean;
  player: NotePlayer;
}

/**
 * Enunciado de un ejercicio de entonación: la tecla de referencia y qué cantar.
 *
 * - Intervalo: la nota base, visible por su nombre.
 * - Notas: UNA sola tecla, con el nombre del acorde, que hace sonar todas las
 *   notas a la vez. Saber cómo se llama no basta: hay que sacar la nota pedida
 *   de lo que suena junto y cantarla.
 *
 * La nota objetivo NO se puede escuchar antes de cantar (sería dar la
 * respuesta). Al corregir, en intervalos aparece su tecla junto a la base; en
 * notas, la tecla del acorde se cambia por un teclado con cada nota por
 * separado y la pedida señalada.
 */
export function SingingExerciseView({ exercise, revealed, player }: SingingExerciseViewProps) {
  const { colors } = useTheme();
  const format = useNoteFormatter();
  const targetLabel = format(exercise.target);

  if (exercise.kind === 'singNote' && revealed) {
    return (
      <View style={styles.container}>
        <ChordKeyboard exercise={exercise} player={player} />
        <Text style={[styles.question, { color: colors.textPrimary }]}>
          {singingQuestionLabel(exercise)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.keys}>
        {exercise.kind === 'singInterval' ? (
          <NoteKey
            label={format({ name: exercise.root, octave: exercise.rootOctave })}
            caption="Nota base"
            disabled={!player.ready}
            accessibilityLabel="Nota base"
            onPress={() => player.press('reference', exercise.rootMidi)}
            onRelease={() => player.release('reference')}
          />
        ) : (
          <NoteKey
            label={chordSymbol(exercise)}
            caption={chordKeyCaption(exercise.tones.length)}
            disabled={!player.ready}
            accessibilityLabel={chordKeyCaption(exercise.tones.length)}
            onPress={() =>
              player.pressChord(
                'reference',
                exercise.tones.map((tone) => tone.midi),
              )
            }
            onRelease={() => player.release('reference')}
          />
        )}

        {revealed && exercise.kind === 'singInterval' && (
          <NoteKey
            label={targetLabel}
            caption="Había que cantar"
            tone="secondary"
            disabled={!player.ready}
            accessibilityLabel={`Nota que había que cantar: ${targetLabel}`}
            onPress={() => player.press('target', exercise.targetMidi)}
            onRelease={() => player.release('target')}
          />
        )}
      </View>

      <Text style={[styles.question, { color: colors.textPrimary }]}>
        {singingQuestionLabel(exercise)}
      </Text>
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
});
