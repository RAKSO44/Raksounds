import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme';

/** Línea discontinua que separa las partes de una hoja de teoría. */
export function DashedDivider() {
  const { colors } = useTheme();
  // Un borde discontinuo solo en un lado no se dibuja en Android: se recorta una caja entera.
  return (
    <View style={styles.clip}>
      <View style={[styles.box, { borderColor: colors.border }]} />
    </View>
  );
}

const BORDER = 2;

const styles = StyleSheet.create({
  clip: {
    height: BORDER,
    overflow: 'hidden',
  },
  box: {
    height: BORDER * 4,
    borderWidth: BORDER,
    borderStyle: 'dashed',
  },
});
