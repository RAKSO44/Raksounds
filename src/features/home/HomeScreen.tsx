import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/shared/design-system';
import { typography, useTheme } from '@/shared/theme';

// Placeholder — el roadmap gamificado llegará en una fase posterior.
export function HomeScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Home" />
      <View style={styles.body}>
        <Text style={[styles.text, { color: colors.textSecondary }]}>Home (próximamente)</Text>
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
