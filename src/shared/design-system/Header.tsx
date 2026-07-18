import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography, useTheme } from '@/shared/theme';

interface HeaderProps {
  title: string;
}

/**
 * Cabecera de marca (morada). Pinta también el área de la barra de estado
 * (inset superior) para que el sistema operativo no "choque" con el contenido
 * y la status bar quede del mismo color que la cabecera.
 */
export function Header({ title }: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.brand, paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Text style={[styles.title, { color: colors.textOnBrand }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  bar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.headerTitle,
  },
});
