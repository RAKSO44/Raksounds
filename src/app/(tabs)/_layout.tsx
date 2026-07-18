import { Tabs } from 'expo-router';

import { DuolingoTabBar, TabBarProps } from '@/shared/design-system';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      // El cast reconcilia BottomTabBarProps (react-navigation, no exportado
      // públicamente por expo-router) con la forma mínima que consumimos.
      tabBar={(props) => <DuolingoTabBar {...(props as unknown as TabBarProps)} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Librería' }} />
      {/* Home y Perfil siguen como rutas (placeholders) pero ocultas del
          tab bar con href: null hasta que se implementen. */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
