import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IntervalId } from '@/domain/ear-training';
import { motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { intervalLabel } from '../labels';

interface AnswerFeedbackProps {
  correct: boolean;
  /** Intervalo correcto, para nombrarlo cuando el usuario falló. */
  answer: IntervalId;
}

/**
 * Franja de corrección que aparece bajo el ejercicio, como el panel verde/rojo
 * que Duolingo desliza desde abajo al comprobar una respuesta. Entra subiendo
 * con un fundido corto; no toca el botón de acción, que sigue siendo el mismo
 * en ambos casos.
 */
export function AnswerFeedback({ correct, answer }: AnswerFeedbackProps) {
  const { colors } = useTheme();
  const background = correct ? colors.successTint : colors.dangerTint;
  const foreground = correct ? colors.successText : colors.dangerText;

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.enter)}
      style={[styles.banner, { backgroundColor: background }]}
    >
      <MaterialCommunityIcons
        name={correct ? 'check-circle' : 'close-circle'}
        size={26}
        color={foreground}
      />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: foreground }]}>{correct ? '¡Correcto!' : 'Casi'}</Text>
        <Text style={[styles.detail, { color: foreground }]}>
          {correct ? intervalLabel(answer) : `Era ${intervalLabel(answer)}`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.headerTitle,
  },
  detail: {
    ...typography.chip,
  },
});
