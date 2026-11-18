import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OverlayHost } from '@/shared/design-system';
import { ThemeProvider, useTheme } from '@/shared/theme';

function ThemedApp() {
  const { colors } = useTheme();

  // Mantiene el fondo del sistema (visible en transiciones y tras la tab bar
  // bajo edge-to-edge) sincronizado con el tema activo.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <OverlayHost>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* Configuración y Créditos viven fuera de las tabs: se abren desde el
            engranaje del Home (y Créditos desde Configuración) y se cierran
            con la flecha de la cabecera. */}
        <Stack.Screen name="settings" />
        <Stack.Screen name="credits" />
        {/* La lista de etapas, desde la tarjeta de etapa del Home. */}
        <Stack.Screen name="stages" />
        {/* La elección de nivel y la ronda también viven fuera de las tabs:
            una ronda empezada no debe poder abandonarse por accidente
            tocando otra pestaña. */}
        <Stack.Screen name="exercise/levels" />
        <Stack.Screen name="exercise/round" />
        <Stack.Screen name="exercise/summary" />
        <Stack.Screen name="exercise/sing" />
        <Stack.Screen name="exercise/sing-summary" />
        {/* Las lecciones del Home (teoría, práctica y resultado), por el mismo
            motivo: una práctica empezada no se abandona tocando otra pestaña. */}
        <Stack.Screen name="lesson/theory" />
        <Stack.Screen name="lesson/practice" />
        <Stack.Screen name="lesson/result" />
      </Stack>
      {/* Iconos claros: la cabecera morada cubre el área de la status bar. */}
      <StatusBar style="light" />
    </OverlayHost>
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
