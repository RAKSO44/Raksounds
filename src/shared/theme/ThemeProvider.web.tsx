import { ReactNode, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/shared/settings';

import { ThemeContext, themeFor } from './ThemeContext';

export { useTheme } from './ThemeContext';
export type { Theme } from './ThemeContext';

/**
 * Variante web de `ThemeProvider` (Metro la usa automáticamente al compilar
 * para esa plataforma — ver "Soporte web" en `.claude/rules/architecture.md`).
 *
 * A diferencia de nativo, acá `isDark` NO controla directamente ningún color
 * (en web, `colors.*` siempre resuelve a `var(--rk-*)` — ver
 * `colors.web.ts`), así que no hace falta ningún gateo de montaje: el string
 * que React renderiza es el mismo sin importar el tema, nunca hay mismatch
 * de hidratación que evitar.
 *
 * Lo único que sí es propio de web es mantener sincronizado `data-theme` en
 * `<html>` (que es lo que de verdad pinta los colores, vía la hoja de
 * estilos de `src/app/+html.tsx`) con la preferencia actual. Un script
 * bloqueante en `+html.tsx` ya lo fija ANTES del primer paint para la carga
 * inicial; este efecto lo mantiene al día cuando el usuario cambia
 * "Apariencia" en Configuración o el sistema cambia de esquema en caliente.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const isDark = themeMode === 'system' ? scheme === 'dark' : themeMode === 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const value = useMemo(() => themeFor(isDark), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
