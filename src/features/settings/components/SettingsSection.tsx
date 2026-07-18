import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { radii, spacing, typography, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface SettingsSectionProps {
  icon: IconName;
  title: string;
  /** Control alineado a la derecha, a la altura del título (p. ej. un toggle). */
  headerRight?: ReactNode;
  children?: ReactNode;
}

/**
 * Tarjeta de una sección de ajustes: cabecera con ícono + título y, opcional,
 * un control a la altura del título (`headerRight`) o debajo (`children`).
 * Agrupa ajustes relacionados como en la referencia visual.
 */
export function SettingsSection({ icon, title, headerRight, children }: SettingsSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.textPrimary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {headerRight}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.headerTitle,
    // Ocupa el espacio libre para empujar `headerRight` al extremo derecho.
    flex: 1,
  },
});
