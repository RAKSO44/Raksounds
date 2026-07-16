import { StyleSheet, Text, View } from 'react-native';

// Placeholder — el roadmap gamificado llegará en una fase posterior.
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home (próximamente)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    opacity: 0.6,
  },
});
