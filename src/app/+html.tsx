import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { cssVarName, darkColors, lightColors, ThemeColors } from '@/shared/theme/colorRoles';

/**
 * Root HTML de Expo Router para el export web (solo corre en Node, sin DOM:
 * ver docs.expo.dev/router/web/static-rendering). Acá se resuelve el
 * problema de raíz que causaba el error #418 de hidratación en modo oscuro:
 * el export estático no puede saber la preferencia real del usuario en build
 * time, así que CUALQUIER color que React calcule en base a esa preferencia
 * va a diferir entre el HTML servido y el primer render del cliente.
 *
 * La solución (la misma que usan next-themes, Chakra UI, GitHub, etc.) es
 * que React deje de decidir el color: los roles de `useTheme()` en web
 * resuelven a `var(--rk-*)` (ver `shared/theme/colors.web.ts`), así que el
 * string que React renderiza es idéntico sin importar el tema — nunca hay
 * nada que hidratar mal. El color real lo define esta hoja de estilos +
 * el script bloqueante de abajo, que corren ANTES de que React pinte nada.
 */
function buildThemeStyleSheet(): string {
  const tokens = Object.keys(lightColors) as (keyof ThemeColors)[];

  const rootVars = tokens.map((token) => `${cssVarName(token)}:${lightColors[token]};`).join('');
  const darkVars = tokens.map((token) => `${cssVarName(token)}:${darkColors[token]};`).join('');

  return `:root{${rootVars}}[data-theme="dark"]{${darkVars}}`;
}

/**
 * Script bloqueante: corre antes del primer paint y decide claro/oscuro con
 * la MISMA prioridad que `ThemeProvider` (preferencia guardada > sistema).
 * Debe ser JS plano (no TS, no imports): se inyecta como texto literal.
 */
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var mode = 'system';
    var raw = localStorage.getItem('settings');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.themeMode) {
        mode = parsed.state.themeMode;
      }
    }
    var isDark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  } catch (e) {
    // Si algo falla (localStorage bloqueado, JSON corrupto), se queda en el
    // claro por defecto de :root — nunca rompe el render.
  }
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Deja que el navegador tematice sus propios controles (scrollbars,
            checkboxes) acorde, sin esperar a React. */}
        <meta name="color-scheme" content="light dark" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: buildThemeStyleSheet() }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
