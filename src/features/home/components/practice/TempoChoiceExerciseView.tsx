import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TempoChoiceExercise, TempoOption } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { useMetronomes } from '../../hooks/useMetronomes';
import { Metronome } from '../Metronome';
import { ExerciseViewProps } from './types';

/**
 * Elegir entre pulsos (A, B…). Elegir una opción la hace sonar SIN FIN en el
 * metrónomo de arriba; elegir otra cambia a esa; volver a pulsar la elegida
 * la deselecciona y lo apaga. Nada deja de sonar por su cuenta.
 *
 * El BPM no se ve hasta corregir. Después, cada opción sigue encendiendo y
 * apagando su pulso (ya sin cambiar la respuesta) y la placa dice su BPM.
 */
export function TempoChoiceExerciseView({
  exercise,
  revealed,
  onAnswer,
}: ExerciseViewProps<TempoChoiceExercise>) {
  const { colors } = useTheme();
  const metronomes = useMetronomes();
  const [selected, setSelected] = useState<string | null>(null);

  const press = (option: TempoOption) => {
    if (revealed) {
      metronomes.toggle(option.id, option.bpm);
      return;
    }
    const next = selected === option.id ? null : option.id;
    setSelected(next);
    onAnswer(next === null ? null : { kind: 'option', id: next });
    if (next === null) metronomes.stop();
    else metronomes.start(option.id, option.bpm);
  };

  const playing = exercise.options.find((option) => option.id === metronomes.active) ?? null;

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      <View style={styles.center}>
        <Metronome
          running={playing !== null}
          bpm={playing?.bpm ?? 0}
          beat={metronomes.beat}
          plate={playing !== null && revealed ? String(playing.bpm) : '?'}
          weightBpm={playing !== null && revealed ? playing.bpm : undefined}
          accessibilityLabel={
            playing === null ? 'Metrónomo apagado' : `Metrónomo: suena la opción ${playing.label}`
          }
        />
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Toca una opción para escucharla
      </Text>

      <View style={styles.row}>
        {exercise.options.map((option, index) => (
          <AnswerOption
            key={option.id}
            index={index}
            label={option.label}
            sublabel={revealed ? `${option.bpm} BPM` : undefined}
            icon="metronome"
            state={answerOptionState({
              option: option.id,
              selected,
              answer: exercise.answer,
              revealed,
            })}
            disabled={!metronomes.ready}
            accessibilityLabel={`Opción ${option.label}`}
            onPressIn={() => press(option)}
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
  center: {
    alignItems: 'center',
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
