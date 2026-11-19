import { StyleSheet, View } from 'react-native';

import { BeatGrade } from '@/domain/lessons';
import { controls, radii, spacing, useTheme } from '@/shared/theme';

interface BeatMarksProps {
  /** Toques que pide el ejercicio. */
  count: number;
  /** Toques hechos: sus marcas ya van pintadas. */
  filled: number;
  /** Al corregir, cómo cayó cada toque (justo, cerca, fallado). */
  grades?: readonly BeatGrade[] | null;
}

/**
 * Una marca por toque. Cada toque pinta la suya, de una en una; al corregir,
 * toman el color de cómo cayó cada toque respecto a su golpe.
 */
export function BeatMarks({ count, filled, grades }: BeatMarksProps) {
  const { colors } = useTheme();
  const gradeColor: Record<BeatGrade, string> = {
    good: colors.success,
    ok: colors.warning,
    miss: colors.danger,
  };

  return (
    <View style={styles.row} accessibilityLabel={`${filled} de ${count} toques`}>
      {Array.from({ length: count }, (_, index) => {
        const grade = grades?.[index];
        const color =
          grade !== undefined
            ? gradeColor[grade]
            : index < filled
              ? colors.secondary
              : colors.progressTrack;
        return <View key={index} style={[styles.mark, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  mark: {
    width: controls.beatMarkSize,
    height: controls.beatMarkSize,
    borderRadius: radii.pill,
  },
});
