import { ScrollView, StyleSheet, View } from 'react-native';

import { Header } from '@/shared/design-system';
import { useSettingsStore } from '@/shared/settings';
import { spacing, useTheme } from '@/shared/theme';

import { SettingsSection, SettingToggle, ThemeModeSelector } from './components';

export function SettingsScreen() {
  const { colors } = useTheme();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Configuración" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection
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

        <SettingsSection icon="palette" title="Apariencia">
          <ThemeModeSelector selected={themeMode} onSelect={setThemeMode} />
        </SettingsSection>
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
