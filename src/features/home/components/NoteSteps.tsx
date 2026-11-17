import { StyleSheet, Text, View } from 'react-native';

import { NOTE_NAMES } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

interface NoteStepsProps {
  /**
   * `all`: cada ficha con su nombre (teoría). `anchor`: solo DO lleva nombre,
   * como punto de partida para contar (práctica).
   */
  labels: 'all' | 'anchor';
  /** Ficha encendida (la que suena o la que se pregunta). */
  highlight?: number | null;
  /** Fichas ya tocadas (teoría): quedan teñidas. */
  visited?: readonly number[];
  /** Con esto las fichas son botones que suenan al tocarlas. */
  onPressStep?: (index: number) => void;
}

function stepHeight(index: number): number {
  return controls.stepTileMinHeight + index * controls.stepTileRise;
}

/**
 * Las siete notas como una escalera: cada ficha un poco más alta que la
 * anterior, porque cada nombre suena un poco más agudo. Es la imagen del
 * ORDEN, no de un instrumento.
 */
export function NoteSteps({ labels, highlight = null, visited = [], onPressStep }: NoteStepsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {NOTE_NAMES.map((name, index) => {
        const label = labels === 'all' || index === 0 ? name : '';
        const lit = index === highlight;
        const height = stepHeight(index);

        if (onPressStep !== undefined) {
          return (
            <PushButton
              key={name}
              variant="selectable"
              tone="brand"
              selected={lit || visited.includes(index)}
              label={label}
              labelStyle={styles.label}
              fillHeight
              style={[styles.step, { height }]}
              accessibilityLabel={`Nota ${name}`}
              onPressIn={() => onPressStep(index)}
            />
          );
        }

        return (
          <View
            key={name}
            accessibilityLabel={lit ? `Ficha marcada, la número ${index + 1}` : undefined}
            style={[
              styles.step,
              styles.staticStep,
              {
                height,
                backgroundColor: lit ? colors.brand : colors.surface,
                borderColor: lit ? colors.brandShadow : colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: lit ? colors.textOnBrand : colors.textPrimary }]}>
              {label}
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
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  step: {
    flex: 1,
  },
  staticStep: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    flexShrink: 0,
  },
});
