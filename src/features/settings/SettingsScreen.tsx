import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Header, PushButton, SectionCard } from '@/shared/design-system';
import { useSettingsStore } from '@/shared/settings';
import { spacing, useTheme } from '@/shared/theme';

import { SettingToggle, ThemeModeSelector } from './components';

export function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const showOctave = useSettingsStore((state) => state.showOctave);
  const setShowOctave = useSettingsStore((state) => state.setShowOctave);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Configuración" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard
          icon="vibrate"
          title="Háptica"
          headerRight={
            <SettingToggle
              accessibilityLabel="Háptica"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
            />
          }
        />

        <SectionCard
          icon="numeric"
          title="Octava"
          headerRight={
            <SettingToggle
              accessibilityLabel="Octava"
              value={showOctave}
              onValueChange={setShowOctave}
            />
          }
        />

        <SectionCard icon="palette" title="Apariencia">
          <ThemeModeSelector selected={themeMode} onSelect={setThemeMode} />
        </SectionCard>

        <SectionCard icon="information" title="Acerca de">
          <PushButton
            label="Créditos"
            icon="heart"
            variant="selectable"
            fullWidth
            onPress={() => router.push('/credits')}
          />
        </SectionCard>
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
    gap: spacing.lg,
  },
});
