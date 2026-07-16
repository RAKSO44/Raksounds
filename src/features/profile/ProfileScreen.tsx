import { StyleSheet, Text, View } from 'react-native';

// Placeholder — logros y desbloqueables llegarán en una fase posterior.
export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Perfil (próximamente)</Text>
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
