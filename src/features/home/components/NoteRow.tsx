import { StyleSheet, Text, View } from 'react-native';

import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

interface NoteRowProps {
  /** Nombres en orden; `null` es el hueco que hay que completar. */
  cells: readonly (string | null)[];
  /** Lo que se muestra en el hueco al corregir. */
  filled?: string | null;
  /** Celda iluminada (la que suena en la teoría). */
  active?: number | null;
}

/**
 * Una fila de nombres de nota con un hueco ("DO · RE · ? · FA"). El hueco va
 * con borde de acento para que se lea como "aquí falta algo".
 */
export function NoteRow({ cells, filled = null, active = null }: NoteRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {cells.map((cell, index) => {
        const isGap = cell === null;
        const lit = index === active;
        const text = isGap ? (filled ?? '?') : cell;
        return (
          <View
            key={index}
            accessibilityLabel={isGap && filled === null ? 'Hueco' : (text ?? undefined)}
            style={[
              styles.cell,
              {
                backgroundColor: lit ? colors.brand : isGap ? colors.secondaryTint : colors.surface,
                borderColor: lit ? colors.brandShadow : isGap ? colors.secondary : colors.border,
                borderStyle: isGap && filled === null ? 'dashed' : 'solid',
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: lit
                    ? colors.textOnBrand
                    : isGap
                      ? colors.secondaryText
                      : colors.textPrimary,
                },
              ]}
            >
              {text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  cell: {
    minWidth: controls.noteCellSize,
    height: controls.noteCellSize,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.note,
    flexShrink: 0,
  },
});
