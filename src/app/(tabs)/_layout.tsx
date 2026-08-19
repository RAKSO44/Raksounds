import { Tabs } from 'expo-router';

import { DuolingoTabBar, TabBarProps } from '@/shared/design-system';
import { useIsWideScreen } from '@/shared/theme';

export default function TabsLayout() {
  const isWide = useIsWideScreen();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // bottom-tabs (v7) ya arma un layout en fila y le da el resto del
        // ancho al contenido cuando la posición es 'left' — ver DuolingoTabBar.
        tabBarPosition: isWide ? 'left' : 'bottom',
      }}
      // El cast reconcilia BottomTabBarProps (react-navigation, no exportado
      // públicamente por expo-router) con la forma mínima que consumimos.
      tabBar={(props) => <DuolingoTabBar {...(props as unknown as TabBarProps)} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Librería' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Ejercicios' }} />
      <Tabs.Screen name="settings" options={{ title: 'Configuración' }} />
      {/* Home y Perfil siguen como rutas (placeholders) pero ocultas del
          tab bar con href: null hasta que se implementen. */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
