import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/shared/design-system';
import { typography, useTheme } from '@/shared/theme';

// Placeholder — logros y desbloqueables llegarán en una fase posterior.
export function ProfileScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Perfil" />
      <View style={styles.body}>
        <Text style={[styles.text, { color: colors.textSecondary }]}>Perfil (próximamente)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.subtitle,
  },
});
