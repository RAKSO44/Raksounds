import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/shared/theme';

import { RichText, Segment } from './RichText';

/** Una lista con viñetas "•" dentro de una hoja de teoría. */
export function TheoryBullets({ items }: { items: readonly (readonly Segment[])[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.list}>
      {items.map((segments, index) => (
        <View key={index} style={styles.item}>
          <Text style={[styles.bullet, { color: colors.textPrimary }]}>•</Text>
          <View style={styles.text}>
            <RichText segments={segments} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
});
