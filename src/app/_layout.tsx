import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '@/shared/theme';

function ThemedApp() {
  const { colors } = useTheme();

  // Mantiene el fondo del sistema (visible en transiciones y tras la tab bar
  // bajo edge-to-edge) sincronizado con el tema activo.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* Créditos vive fuera de las tabs: se abre desde Configuración y se
            cierra con la flecha de la cabecera. */}
        <Stack.Screen name="credits" />
        {/* La elección de nivel y la ronda también viven fuera de las tabs:
            una ronda empezada no debe poder abandonarse por accidente
            tocando otra pestaña. */}
        <Stack.Screen name="exercise/levels" />
        <Stack.Screen name="exercise/round" />
      </Stack>
      {/* Iconos claros: la cabecera morada cubre el área de la status bar. */}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default function RootLayout() {
  return (
    // Raíz obligatoria de gesture-handler: sin ella los gestos de PushButton
    // (y con ellos la pulsación simultánea de varias notas) no se registran.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
