import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ExerciseMode } from '@/domain/ear-training';
import { SINGING_KINDS, SingingKind } from '@/domain/singing';
import { Header, PushButton } from '@/shared/design-system';
import { controls, motion, spacing, typography, useTheme } from '@/shared/theme';

import {
  MIXED_VERTICAL_LABEL,
  MODE_DESCRIPTIONS,
  MODE_ICONS,
  MODE_LABELS,
  SINGING_DESCRIPTIONS,
  SINGING_ICONS,
  SINGING_LABELS,
} from '../labels';
import { MicPermissionDialog } from '../components';
import { useMicrophoneGate } from '../hooks/useMicrophoneGate';

/** Los dos tipos sueltos, en el orden en que se aprenden. */
const SINGLE_MODES: readonly ExerciseMode[] = ['interval', 'note'];

/**
 * Menú de la sección Ejercicios, en dos bloques: los ejercicios auditivos
 * (identificar lo que suena) y los de entonación (cantarlo). La dificultad se
 * elige después, en su propia pantalla.
 *
 * Los dos tipos sueltos se apilan a la izquierda y la mezcla ocupa una columna
 * a su derecha, a color entero y con el nombre en vertical: se lee de un
 * vistazo que es "los dos a la vez", sin repetir una tercera fila igual a las
 * otras dos.
 */
export function ExercisesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const micGate = useMicrophoneGate();

  const openLevels = (mode: ExerciseMode | SingingKind) =>
    router.push({ pathname: '/exercise/levels', params: { mode } });
  // Sin micrófono no se puede cantar: el permiso se pide antes de entrar.
  const openSinging = (kind: SingingKind) => micGate.requestThen(() => openLevels(kind));

  // Los de entonación entran después de los auditivos, siguiendo la cascada.
  const singingDelay = (SINGLE_MODES.length + 1) * motion.stagger;

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

        <View style={[styles.sectionHeader, styles.sectionSpacing]}>
          <MaterialCommunityIcons name="microphone" size={20} color={colors.textSecondary} />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Ejercicios de entonación
          </Text>
        </View>

        {SINGING_KINDS.map((kind, index) => (
          <Animated.View
            key={kind}
            entering={FadeInDown.duration(motion.enter).delay(
              singingDelay + index * motion.stagger,
            )}
          >
            <PushButton
              variant="selectable"
              icon={SINGING_ICONS[kind]}
              iconPlacement="start"
              label={SINGING_LABELS[kind]}
              sublabel={SINGING_DESCRIPTIONS[kind]}
              fullWidth
              accessibilityLabel={SINGING_LABELS[kind]}
              onPress={() => openSinging(kind)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <MicPermissionDialog visible={micGate.denied} onClose={micGate.dismiss} />
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
  sectionSpacing: {
    marginTop: spacing.md,
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
