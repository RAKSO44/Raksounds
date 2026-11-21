import { StyleSheet, Text, View } from 'react-native';

import { LessonExercise } from '@/domain/lessons';
import { typography, useTheme } from '@/shared/theme';

import { RichText } from '../theory/RichText';

/**
 * El enunciado de un ejercicio, centrado. Si lleva figuras ("¿Qué figura dura
 * la mitad de 𝅗𝅥?"), van dibujadas en línea en su ficha, como en la teoría; el
 * lector de pantalla lee el enunciado en palabras.
 */
export function ExercisePrompt({ exercise }: { exercise: LessonExercise }) {
  const { colors } = useTheme();
  if (exercise.promptParts === undefined) {
    return (
      <Text accessibilityRole="header" style={[styles.prompt, { color: colors.textPrimary }]}>
        {exercise.prompt}
      </Text>
    );
  }
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={exercise.prompt}>
      {/* Las fichas de las figuras ya se leen en el enunciado entero. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <RichText segments={exercise.promptParts} strong centered />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.question,
    textAlign: 'center',
  },
});
