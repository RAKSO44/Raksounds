import { StyleSheet, View } from 'react-native';

import { SCALE_FAMILIES, ScaleFamily } from '@/domain/music-theory';
import { PushButton } from '@/shared/design-system';
import { spacing } from '@/shared/theme';

import { FAMILY_LABELS } from '../labels';

interface ScaleFamilySelectorProps {
  selected: ScaleFamily;
  onSelect: (family: ScaleFamily) => void;
}

/** Primer nivel del tipo: Mayor / Menor. */
export function ScaleFamilySelector({ selected, onSelect }: ScaleFamilySelectorProps) {
  return (
    <View style={styles.container}>
      {SCALE_FAMILIES.map((family) => (
        <PushButton
          key={family}
          variant="selectable"
          label={FAMILY_LABELS[family]}
          selected={family === selected}
          onPress={() => onSelect(family)}
          style={styles.item}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
  },
});
