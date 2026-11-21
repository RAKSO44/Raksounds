import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { controls, spacing, useTheme } from '@/shared/theme';

import { RichText, Segment } from './RichText';

export interface ChecklistItem {
  readonly segments: readonly Segment[];
  /**
   * `check`: lo que hay que quedarse (✓ a la izquierda). `wrong`: un ejemplo
   * de lo que NO es cierto, sangrado bajo el punto anterior y con la ✗ al
   * final, como una frase tachada.
   */
  readonly kind?: 'check' | 'wrong';
}

/** La lista "Nota que: ✓ … ✓ …" con la que cierran las hojas de teoría. */
export function TheoryChecklist({ items }: { items: readonly ChecklistItem[] }) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {items.map((item, index) =>
        item.kind === 'wrong' ? (
          <View key={index} style={[styles.item, styles.wrong]}>
            <View style={styles.text}>
              <RichText segments={item.segments} />
            </View>
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={controls.theoryCheckIconSize}
              color={colors.dangerText}
              accessibilityLabel="Falso"
            />
          </View>
        ) : (
          <View key={index} style={styles.item}>
            <MaterialCommunityIcons
              name="check-bold"
              size={controls.theoryCheckIconSize}
              color={colors.successText}
            />
            <View style={styles.text}>
              <RichText segments={item.segments} />
            </View>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  wrong: {
    alignItems: 'center',
    paddingLeft: spacing.xl,
  },
  text: {
    flex: 1,
  },
});
