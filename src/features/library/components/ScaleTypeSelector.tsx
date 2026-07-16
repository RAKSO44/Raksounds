import { StyleSheet, View } from 'react-native';

import { ALL_SCALE_TYPES, ScaleType } from '@/domain/music-theory';
import { SelectableChip } from '@/shared/design-system';
import { spacing } from '@/shared/theme';

import { SCALE_TYPE_LABELS } from '../scaleTypeLabels';

interface ScaleTypeSelectorProps {
  selected: ScaleType;
  onSelect: (type: ScaleType) => void;
}

/** Selector del tipo de contenido: escalas y arpegios del MVP. */
export function ScaleTypeSelector({ selected, onSelect }: ScaleTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {ALL_SCALE_TYPES.map((type) => (
        <SelectableChip
          key={type}
          label={SCALE_TYPE_LABELS[type]}
          selected={type === selected}
          onPress={() => onSelect(type)}
        />
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
});
