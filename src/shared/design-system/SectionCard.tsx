import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { radii, spacing, typography, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface SectionCardProps {
  icon: IconName;
  title: string;
  /** Control alineado a la derecha, a la altura del título (p. ej. un toggle). */
  headerRight?: ReactNode;
  children?: ReactNode;
}

/**
 * Tarjeta de sección: cabecera con ícono + título y, opcional, un control a la
 * altura del título (`headerRight`) o contenido debajo (`children`). Agrupa
 * ajustes o bloques de información relacionados como en la referencia visual.
 */
export function SectionCard({ icon, title, headerRight, children }: SectionCardProps) {
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
    // Aire generoso: con el padding justo, el título quedaba pegado al borde
    // y al contenido, y la pantalla se leía apretada.
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // Deja respirar al título dentro de su propia fila (los íconos miden más
    // que el texto y sin esto la cabecera se ve estrecha).
    minHeight: spacing.lg,
  },
  title: {
    ...typography.headerTitle,
    // Ocupa el espacio libre para empujar `headerRight` al extremo derecho.
    flex: 1,
  },
});
