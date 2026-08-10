import { ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/shared/settings';

import { ThemeContext, themeFor } from './ThemeContext';

export { useTheme } from './ThemeContext';
export type { Theme } from './ThemeContext';

/**
 * Provee el tema activo. La preferencia del usuario (`themeMode`) manda: en
 * `system` sigue al SO (`useColorScheme`), y en `light`/`dark` fuerza ese modo.
 * Un único punto de decisión claro/oscuro para toda la app.
 *
 * En nativo no existe una pasada de hidratación SSR (esa es una particularidad
 * de la exportación web de Expo Router): el esquema real del SO se conoce
 * desde el primer render, así que acá no hace falta ningún gateo de montaje.
 * Ver `ThemeProvider.web.tsx` para el caso de web, donde sí importa.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const isDark = themeMode === 'system' ? scheme === 'dark' : themeMode === 'dark';

  const value = useMemo(() => themeFor(isDark), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
