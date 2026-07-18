import { StyleSheet, View } from 'react-native';

import { CHROMATIC_ROOTS, formatNoteName, NoteName, sameNoteName } from '@/domain/music-theory';
import { PushButton } from '@/shared/design-system';
import { spacing } from '@/shared/theme';

interface RootNotePickerProps {
  selected: NoteName;
  onSelect: (root: NoteName) => void;
}

/** Selector de la nota base: las 12 tónicas con su deletreo convencional. */
export function RootNotePicker({ selected, onSelect }: RootNotePickerProps) {
  return (
    <View style={styles.container}>
      {CHROMATIC_ROOTS.map((root) => (
        <PushButton
          key={formatNoteName(root)}
          variant="selectable"
          label={formatNoteName(root)}
          selected={sameNoteName(root, selected)}
          onPress={() => onSelect(root)}
          minWidth={56}
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
