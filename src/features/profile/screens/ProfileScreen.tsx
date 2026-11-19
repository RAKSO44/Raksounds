import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '@/shared/design-system';
import { useSettingsAction } from '@/shared/navigation';
import { spacing, typography, useTheme } from '@/shared/theme';

/** Tamaño del ícono de la pantalla vacía. */
const ICON_SIZE = 72;

// Placeholder — logros y desbloqueables llegarán en una fase posterior.
export function ProfileScreen() {
  const { colors } = useTheme();
  const settings = useSettingsAction();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Perfil" action={settings} />
      <View style={styles.body}>
        <MaterialCommunityIcons name="account-circle" size={ICON_SIZE} color={colors.brand} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Próximamente</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Aquí verás tu progreso y tus logros.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  text: {
    ...typography.subtitle,
    textAlign: 'center',
  },
});
