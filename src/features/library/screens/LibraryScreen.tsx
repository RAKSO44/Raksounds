import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/shared/theme';

import { RootNotePicker, ScaleDegreeButtons, ScaleTypeSelector } from '../components';
import { useScalePlayer } from '../hooks/useScalePlayer';

export function LibraryScreen() {
  const { root, setRoot, scaleType, setScaleType, scale, ready, playDegree } = useScalePlayer();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Librería</Text>

        <Text style={styles.sectionLabel}>Nota base</Text>
        <RootNotePicker selected={root} onSelect={setRoot} />

        <Text style={styles.sectionLabel}>Tipo</Text>
        <ScaleTypeSelector selected={scaleType} onSelect={setScaleType} />

        <Text style={styles.sectionLabel}>Notas</Text>
        <ScaleDegreeButtons degrees={scale.degrees} onPressDegree={playDegree} disabled={!ready} />
        <Text style={styles.hint}>
          {ready ? 'Toca una nota para escucharla' : 'Cargando sonidos…'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
