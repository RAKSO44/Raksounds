import { StyleSheet, View } from 'react-native';

import { NOTE_NAMES } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { controls, spacing, typography } from '@/shared/theme';

interface NoteStepsProps {
  /**
   * Qué barras llevan su nombre: todas (al corregir), solo DO como punto de
   * partida para contar, o ninguna (hay que reconocerla de oído).
   */
  labels: 'all' | 'anchor' | 'none';
  /** Barras pintadas. */
  lit: readonly number[];
  /** Cada barra suena al tocarla. */
  onPressStep: (index: number) => void;
}

function stepHeight(index: number): number {
  return controls.stepTileMinHeight + index * controls.stepTileRise;
}

/**
 * Las siete notas como una escalera: cada barra un poco más alta que la
 * anterior, porque cada nombre suena un poco más agudo. Es la imagen del
 * ORDEN, no de un instrumento. Toda barra suena al tocarla, y varias a la vez
 * suenan juntas.
 */
export function NoteSteps({ labels, lit, onPressStep }: NoteStepsProps) {
  return (
    <View style={styles.row}>
      {NOTE_NAMES.map((name, index) => {
        const shown = labels === 'all' || (labels === 'anchor' && index === 0);
        const on = lit.includes(index);
        return (
          <PushButton
            key={name}
            variant="selectable"
            tone="brand"
            selected={on}
            label={shown ? name : ''}
            labelStyle={styles.label}
            fillHeight
            style={[styles.step, { height: stepHeight(index) }]}
            accessibilityLabel={
              shown ? `Nota ${name}` : on ? `Barra ${index + 1}, marcada` : `Barra ${index + 1}`
            }
            onPressIn={() => onPressStep(index)}
          />
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
  label: {
    ...typography.caption,
    flexShrink: 0,
  },
});
