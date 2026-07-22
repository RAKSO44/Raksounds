import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/shared/design-system';
import { useSettingsStore } from '@/shared/settings';
import { spacing, typography, useTheme } from '@/shared/theme';

import {
  RootNotePicker,
  ScaleDegreeButtons,
  ScaleFamilySelector,
  ScaleSubtypeSelector,
} from '../components';
import { useScalePlayer } from '../hooks/useScalePlayer';

export function LibraryScreen() {
  const { colors } = useTheme();
  const {
    root,
    setRoot,
    family,
    setFamily,
    scaleType,
    setScaleType,
    scale,
    ready,
    pressDegree,
    releaseDegree,
  } = useScalePlayer();
  const showOctave = useSettingsStore((state) => state.showOctave);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Librería" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>Nota base</SectionLabel>
        <RootNotePicker selected={root} onSelect={setRoot} />

        <SectionLabel>Tipo</SectionLabel>
        <ScaleFamilySelector selected={family} onSelect={setFamily} />
        <ScaleSubtypeSelector family={family} selected={scaleType} onSelect={setScaleType} />

        <SectionLabel>Notas</SectionLabel>
        <ScaleDegreeButtons
          degrees={scale.degrees}
          onPressDegree={pressDegree}
          onReleaseDegree={releaseDegree}
          disabled={!ready}
          showOctave={showOctave}
        />
        {!ready && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando sonidos…</Text>
        )}
      </ScrollView>
    </View>
  );
}

/** Rótulo de sección reutilizado dentro de la pantalla. */
function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
  },
});
