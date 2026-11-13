import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
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
        <Stack.Screen name="exercise/summary" />
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
  // En nativo estas fuentes ya vienen embebidas por el plugin `expo-font`
  // (ver app.config.ts) y esto resuelve al instante; en web es la carga de
  // verdad, porque ahí no hay binario donde embeberlas. Hasta que estén no se
  // pinta nada: medir un texto con la fuente del sistema y luego pintarlo con
  // Poppins es justo lo que recorta las etiquetas.
  const [fontsLoaded] = useFonts({
    Poppins_400Regular: require('../../assets/fonts/Poppins_400Regular.ttf'),
    Poppins_500Medium: require('../../assets/fonts/Poppins_500Medium.ttf'),
    Poppins_600SemiBold: require('../../assets/fonts/Poppins_600SemiBold.ttf'),
    Poppins_700Bold: require('../../assets/fonts/Poppins_700Bold.ttf'),
    Poppins_800ExtraBold: require('../../assets/fonts/Poppins_800ExtraBold.ttf'),
  });

  if (!fontsLoaded) return null;

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
