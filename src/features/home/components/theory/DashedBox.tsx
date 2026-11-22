import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, spacing, useTheme } from '@/shared/theme';

/** Recuadro de borde discontinuo: algo que hay que tener a mano en la hoja. */
export function DashedBox({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.box, { borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
