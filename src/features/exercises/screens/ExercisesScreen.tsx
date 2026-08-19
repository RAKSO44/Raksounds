import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EXERCISE_MODES, ExerciseMode } from '@/domain/ear-training';
import { Header, PushButton } from '@/shared/design-system';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { MODE_DESCRIPTIONS, MODE_ICONS, MODE_LABELS } from '../labels';

/**
 * Menú de la sección Ejercicios: elegir qué tipo de ejercicio auditivo
 * practicar. La dificultad se elige después, en su propia pantalla.
 *
 * "Combinado" va a color entero (es la opción recomendada, la que mezcla los
 * dos tipos) y los tipos sueltos quedan como selectores neutros: la jerarquía
 * de siempre entre un botón sólido y uno transparente.
 */
export function ExercisesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Ejercicios" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Ejercicios auditivos
        </Text>

        {EXERCISE_MODES.map((mode: ExerciseMode, index) => (
          <Animated.View
            key={mode}
            entering={FadeInDown.duration(motion.enter).delay(index * motion.stagger)}
          >
            <PushButton
              variant={mode === 'mixed' ? 'solid' : 'selectable'}
              icon={MODE_ICONS[mode]}
              label={MODE_LABELS[mode]}
              sublabel={MODE_DESCRIPTIONS[mode]}
              fullWidth
              accessibilityLabel={MODE_LABELS[mode]}
              onPress={() => router.push({ pathname: '/exercise/levels', params: { mode } })}
            />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.sectionLabel,
  },
});
