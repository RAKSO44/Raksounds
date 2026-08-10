import { createContext, useContext } from 'react';

import { darkColors, lightColors, ThemeColors } from './colors';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

/**
 * Contexto puro (sin lógica de plataforma): lo comparten `ThemeProvider.tsx`
 * (nativo) y `ThemeProvider.web.tsx` para que `useTheme` y la forma de
 * `Theme` nunca diverjan entre ambos, aunque calculen `isDark` distinto.
 */
export const ThemeContext = createContext<Theme | null>(null);

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  }
  return theme;
}

export function themeFor(isDark: boolean): Theme {
  return { colors: isDark ? darkColors : lightColors, isDark };
}
