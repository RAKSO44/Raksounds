import { StyleSheet, Text, View } from 'react-native';

export function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Librería</Text>
      <Text style={styles.subtitle}>Escalas y arpegios — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
