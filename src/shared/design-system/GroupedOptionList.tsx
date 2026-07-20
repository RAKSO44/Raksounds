import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hapticTap } from '@/shared/haptics';
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

  const selectedIndex = options.findIndex((option) => option.key === selectedKey);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {options.map((option, index) => {
        const selected = option.key === selectedKey;
        // El divisor entre esta fila y la anterior se oculta si cualquiera de
        // las dos está seleccionada: así el borde de color de la fila activa se
        // integra con la agrupación en vez de convivir con una línea gris.
        const showDivider = index > 0 && index !== selectedIndex && index - 1 !== selectedIndex;
        return (
          <View key={option.key}>
            {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.key)}
              // Botón NO alzado: un solo golpe seco al presionar (sin par baja/sube).
              onPressIn={hapticTap}
              style={[
                styles.row,
                index === 0 && styles.rowFirst,
                index === options.length - 1 && styles.rowLast,
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
    // Sin padding y con recorte: las filas van a ras del borde del grupo y el
    // resaltado de la fila activa llega hasta las esquinas redondeadas.
    overflow: 'hidden',
  },
  divider: {
    height: 1.5,
  },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    // Borde transparente en reposo: reserva el espacio para que al seleccionar
    // el borde de color no desplace el layout. Sin radio: la fila activa queda
    // integrada a ras de la agrupación (estilo Duolingo).
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  // Redondea las esquinas exteriores de los extremos para que el borde de la
  // fila activa siga la curva del grupo (radio del grupo menos el borde).
  rowFirst: {
    borderTopLeftRadius: radii.lg - 2,
    borderTopRightRadius: radii.lg - 2,
  },
  rowLast: {
    borderBottomLeftRadius: radii.lg - 2,
    borderBottomRightRadius: radii.lg - 2,
  },
  label: {
    ...typography.chip,
  },
});
