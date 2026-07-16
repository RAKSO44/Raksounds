import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Chip presionable para selección exclusiva dentro de un grupo. */
export function SelectableChip({ label, selected, onPress }: SelectableChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && (selected ? styles.chipSelectedPressed : styles.chipPressed),
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipSelectedPressed: {
    backgroundColor: colors.accentPressed,
  },
  label: {
    ...typography.chip,
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.onAccent,
  },
});
