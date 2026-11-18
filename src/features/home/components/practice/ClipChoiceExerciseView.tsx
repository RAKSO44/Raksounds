import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Clip, ClipChoiceExercise } from '@/domain/lessons';
import { AnswerOption, answerOptionState } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { PulseLight } from '../PulseLight';
import { singleNote } from './StimulusView';
import { ExerciseViewProps } from './types';

/**
 * Cada opción ES un sonido (o una luz que parpadea). Pulsarla la reproduce y la
 * elige; se puede repetir tantas veces como haga falta, también al corregir.
 * Para confirmar hay que haber pulsado TODAS: comparar es el ejercicio.
 *
 * Si cada opción es una nota suelta (¿cuál es más agudo?), es una tecla: suena
 * al tocarla, varias suenan juntas y cuenta como escuchada en el acto. Si son
 * pulsos o destellos (Módulo 2), la luz de arriba acompaña cada golpe y la
 * opción cuenta como escuchada al terminar.
 */
export function ClipChoiceExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<ClipChoiceExercise>) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [heard, setHeard] = useState<readonly string[]>([]);
  const [pulseCount, setPulseCount] = useState(0);

  const visual = exercise.options.every((option) => option.clip.kind === 'flash');
  const keys = exercise.options.every((option) => singleNote(option.clip) !== null);
  const allHeard = heard.length === exercise.options.length;

  // La respuesta solo se entrega con todas escuchadas; hasta entonces la
  // elección se ve, pero "Comprobar" sigue apagado.
  useEffect(() => {
    if (allHeard && selected !== null && !revealed) onAnswer({ kind: 'option', id: selected });
  }, [allHeard, selected, revealed, onAnswer]);

  const markHeard = (id: string) =>
    setHeard((previous) => (previous.includes(id) ? previous : [...previous, id]));

  const choose = (id: string, clip: Clip) => {
    const midi = singleNote(clip);
    if (keys && midi !== null) {
      if (!player.ready) return;
      player.playNote(midi);
      markHeard(id);
    } else {
      player.play(clip, {
        onEvent: () => setPulseCount((count) => count + 1),
        // Cuenta como escuchada al terminar: si el audio no arrancó, no cuenta.
        onEnd: () => markHeard(id),
      });
    }
    if (!revealed) setSelected(id);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      {!keys && (
        <>
          <View style={styles.light}>
            <PulseLight pulseCount={pulseCount} />
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {allHeard
              ? 'Puedes volver a escucharlas'
              : visual
                ? 'Toca cada opción para verla'
                : 'Toca cada opción para escucharla'}
          </Text>
        </>
      )}

      <View style={styles.row}>
        {exercise.options.map((option, index) => (
          <AnswerOption
            key={option.id}
            index={index}
            label={option.label}
            sublabel={revealed ? option.reveal : undefined}
            icon={visual ? 'lightbulb-on-outline' : 'volume-high'}
            state={answerOptionState({
              option: option.id,
              selected,
              answer: exercise.answer,
              revealed,
            })}
            disabled={!player.ready && !visual}
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
  light: {
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
