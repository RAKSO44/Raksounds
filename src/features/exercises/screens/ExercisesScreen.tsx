import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ExerciseMode } from '@/domain/ear-training';
import { Header, PushButton } from '@/shared/design-system';
import { controls, motion, spacing, typography, useTheme } from '@/shared/theme';

import { MIXED_VERTICAL_LABEL, MODE_DESCRIPTIONS, MODE_ICONS, MODE_LABELS } from '../labels';

/** Los dos tipos sueltos, en el orden en que se aprenden. */
const SINGLE_MODES: readonly ExerciseMode[] = ['interval', 'note'];

/**
 * Menú de la sección Ejercicios: elegir qué tipo de ejercicio auditivo
 * practicar. La dificultad se elige después, en su propia pantalla.
 *
 * Los dos tipos sueltos se apilan a la izquierda y la mezcla ocupa una columna
 * a su derecha, a color entero y con el nombre en vertical: se lee de un
 * vistazo que es "los dos a la vez", sin repetir una tercera fila igual a las
 * otras dos.
 */
export function ExercisesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const openLevels = (mode: ExerciseMode) =>
    router.push({ pathname: '/exercise/levels', params: { mode } });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Ejercicios" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="ear-hearing" size={20} color={colors.textSecondary} />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Ejercicios auditivos
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.singles}>
            {SINGLE_MODES.map((mode, index) => (
              <Animated.View
                key={mode}
                entering={FadeInDown.duration(motion.enter).delay(index * motion.stagger)}
              >
                <PushButton
                  variant="selectable"
                  icon={MODE_ICONS[mode]}
                  iconPlacement="start"
                  label={MODE_LABELS[mode]}
                  sublabel={MODE_DESCRIPTIONS[mode]}
                  fullWidth
                  accessibilityLabel={MODE_LABELS[mode]}
                  onPress={() => openLevels(mode)}
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInDown.duration(motion.enter).delay(SINGLE_MODES.length * motion.stagger)}
            style={styles.mixed}
          >
            <PushButton
              variant="solid"
              label={MIXED_VERTICAL_LABEL}
              labelStyle={typography.note}
              fillHeight
              // `fullWidth` (alignSelf: stretch) es lo que hace que la cara
              // llegue al borde de su columna: sin él el botón se encoge a su
              // contenido y deja un hueco muerto a la derecha.
              fullWidth
              style={styles.mixedButton}
              accessibilityLabel={MODE_LABELS.mixed}
              onPress={() => openLevels('mixed')}
            />
          </Animated.View>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.sectionLabel,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  singles: {
    flex: 1,
    gap: spacing.md,
  },
  mixed: {
    width: controls.verticalOptionWidth,
  },
  mixedButton: {
    flex: 1,
  },
});
