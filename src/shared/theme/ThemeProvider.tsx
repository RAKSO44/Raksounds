import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useSettingsStore } from '@/shared/settings';

import { darkColors, lightColors, ThemeColors } from './colors';
import { useSystemColorScheme } from './useSystemColorScheme';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

/**
 * Provee el tema activo. La preferencia del usuario (`themeMode`) manda: en
 * `system` sigue al SO (`useColorScheme`), y en `light`/`dark` fuerza ese modo.
 * Un único punto de decisión claro/oscuro para toda la app.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useSystemColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const isDark = themeMode === 'system' ? scheme === 'dark' : themeMode === 'dark';

  const value = useMemo<Theme>(
    () => ({ colors: isDark ? darkColors : lightColors, isDark }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  }
  return theme;
}
