import { Tabs } from 'expo-router';

import { DuolingoTabBar, TabBarProps } from '@/shared/design-system';
import { ExitConfirmation } from '@/shared/navigation';
import { useIsWideScreen } from '@/shared/theme';

export default function TabsLayout() {
  const isWide = useIsWideScreen();

  return (
    <>
      {/* Vive aquí, en la raíz de las pestañas, porque es el único sitio donde
          "atrás" significa cerrar la app. */}
      <ExitConfirmation />
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
        {/* El Home (la ruta de aprendizaje) es `index`: la app abre en `/`,
          así que es la pestaña inicial, como en Duolingo. */}
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="library" options={{ title: 'Librería' }} />
        <Tabs.Screen name="exercises" options={{ title: 'Ejercicios' }} />
        {/* Perfil es un placeholder ("Próximamente"). Configuración ya no es
          pestaña: se abre desde el engranaje de la cabecera del Home. */}
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      </Tabs>
    </>
  );
}
