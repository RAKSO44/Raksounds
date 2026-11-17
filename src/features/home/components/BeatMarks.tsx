import { StyleSheet, View } from 'react-native';

import { BeatGrade } from '@/domain/lessons';
import { controls, radii, spacing, useTheme } from '@/shared/theme';

interface BeatMarksProps {
  /** Golpes de entrada (marcas pequeñas, sin calificar). */
  countIn: number;
  /** Golpes que se califican. */
  beats: number;
  /** Golpe sonando ahora (índice sobre entrada + calificados), o -1. */
  active: number;
  /** Calificación de cada golpe tras la pasada. */
  grades?: readonly BeatGrade[] | null;
}

/**
 * Una marca por golpe. Mientras suena, se ilumina la del golpe en curso; al
 * terminar, cada marca calificada toma el color de cómo se tocó (justo, cerca,
 * fallado), que es la corrección "por cercanía temporal".
 */
export function BeatMarks({ countIn, beats, active, grades }: BeatMarksProps) {
  const { colors } = useTheme();
  const gradeColor: Record<BeatGrade, string> = {
    good: colors.success,
    ok: colors.warning,
    miss: colors.danger,
  };

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: countIn + beats }, (_, index) => {
        const isCountIn = index < countIn;
        const grade = isCountIn ? undefined : grades?.[index - countIn];
        const color =
          index === active
            ? colors.brand
            : grade !== undefined
              ? gradeColor[grade]
              : colors.progressTrack;
        return (
          <View
            key={index}
            style={[
              styles.mark,
              isCountIn && styles.countIn,
              { backgroundColor: color },
              index === countIn && countIn > 0 && styles.firstScored,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mark: {
    width: controls.beatMarkSize,
    height: controls.beatMarkSize,
    borderRadius: radii.pill,
  },
  countIn: {
    width: controls.beatMarkSize / 2,
    height: controls.beatMarkSize / 2,
  },
  firstScored: {
    marginLeft: spacing.sm,
  },
});
