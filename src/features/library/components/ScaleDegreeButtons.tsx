import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNote, ScaleDegree } from '@/domain/music-theory';
import { colors, radii, spacing, typography } from '@/shared/theme';

interface ScaleDegreeButtonsProps {
  degrees: readonly ScaleDegree[];
  onPressDegree: (degree: ScaleDegree) => void;
  /** Deshabilita los botones mientras cargan las muestras de audio. */
  disabled?: boolean;
}

/** Cada grado de la escala/arpegio como botón que suena al presionarlo. */
export function ScaleDegreeButtons({ degrees, onPressDegree, disabled }: ScaleDegreeButtonsProps) {
  return (
    <View style={styles.container}>
      {degrees.map((degree) => (
        <Pressable
          key={degree.degreeIndex}
          accessibilityRole="button"
          accessibilityLabel={`Nota ${formatNote(degree.note)}`}
          disabled={disabled}
          onPress={() => onPressDegree(degree)}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}
        >
          {({ pressed }) => (
            <>
              <Text style={[styles.noteName, pressed && styles.textPressed]}>
                {formatNote(degree.note)}
              </Text>
              <Text style={[styles.degreeNumber, pressed && styles.textPressed]}>
                {degree.degreeIndex + 1}
              </Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    minWidth: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttonPressed: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  noteName: {
    ...typography.note,
    color: colors.textPrimary,
  },
  degreeNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textPressed: {
    color: colors.onAccent,
  },
});
