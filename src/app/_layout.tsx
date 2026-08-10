import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  // Precarga la única familia de íconos que usa la app. Tiene que llamarse
  // durante el render (no en un efecto, no a nivel de módulo): el export
  // estático de web envuelve CADA render de página en
  // `Font.withServerContext(...)`, que arranca un registro de fuentes VACÍO
  // por página — un efecto nunca corre en ese render de servidor, y una
  // llamada a nivel de módulo corre una sola vez para todo el proceso, fuera
  // de ese contexto (revienta con "accessed outside of withServerContext").
  //
  // Sin esto, `@expo/vector-icons` decide por instancia si pinta el glifo
  // real o un `<Text />` vacío según `Font.isLoaded()`. En el render de
  // servidor de Node eso es sistemáticamente `false` salvo que algo lo
  // registre durante ESE MISMO render; en el navegador, en cambio, se vuelve
  // `true` en cuanto cualquier ícono se monta antes que otro. Ese desfase es
  // un mismatch de hidratación real (React error #418) — no depende del
  // tema, y seguía ocurriendo incluso con los colores ya resueltos vía
  // variables CSS. Llamarlo acá, arriba de todo el árbol, deja `isLoaded()`
  // en `true` desde el primer ícono en ambos lados, siempre.
  MaterialCommunityIcons.loadFont();

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
