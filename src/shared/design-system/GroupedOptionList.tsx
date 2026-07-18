import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hapticPressIn, hapticPressOut } from '@/shared/haptics';
import { radii, spacing, typography, useTheme } from '@/shared/theme';

export interface GroupedOption {
  key: string;
  label: string;
}

interface GroupedOptionListProps {
  options: readonly GroupedOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

/**
 * Lista agrupada estilo Duolingo: una sola tarjeta con filas separadas por
 * divisores; la fila activa se resalta con el acento secundario. Es una
 * jerarquía visual por debajo de los botones 3D (que quedan para el nivel
 * principal), ideal para opciones relacionadas entre sí.
 */
export function GroupedOptionList({ options, selectedKey, onSelect }: GroupedOptionListProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {options.map((option, index) => {
        const selected = option.key === selectedKey;
        return (
          <View key={option.key}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.key)}
              onPressIn={hapticPressIn}
              onPressOut={hapticPressOut}
              style={[
                styles.row,
                selected && { backgroundColor: colors.secondaryTint, borderColor: colors.secondary },
              ]}
            >
              <Text
                style={[styles.label, { color: selected ? colors.secondaryText : colors.textPrimary }]}
              >
                {option.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.xs,
  },
  divider: {
    height: 1.5,
    marginHorizontal: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    // Borde transparente en reposo: reserva el espacio para que al seleccionar
    // el borde de color no desplace el layout.
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  label: {
    ...typography.chip,
  },
});
