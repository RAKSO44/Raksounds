import { cssVarName, lightColors as hexLightColors, ThemeColors } from './colorRoles';

export type { ThemeColors } from './colorRoles';

/**
 * Variante web: en vez de valores hex fijos, cada rol resuelve a
 * `var(--rk-<rol>)`. Esa variable la define `src/app/+html.tsx` (generada a
 * partir de `colorRoles.ts`, mismos hex que nativo) en una hoja `<style>`
 * global, y un script bloqueante en el `<head>` decide claro/oscuro ANTES de
 * que React pinte nada, escribiendo `data-theme` en `<html>`.
 *
 * Como el string que React termina renderizando (`"var(--rk-brand)"`) es
 * IDÉNTICO sin importar el tema, el HTML estático que exporta Expo Router
 * (siempre generado en Node, sin saber el esquema real del usuario) y el
 * primer render del cliente nunca difieren — se elimina de raíz el mismatch
 * de hidratación que causaba el error #418, no se lo esconde con un gateo de
 * montaje. El color real lo resuelve la cascada CSS, no React.
 */
function makeCssVarColors(): ThemeColors {
  const entries = (Object.keys(hexLightColors) as (keyof ThemeColors)[]).map(
    (token) => [token, `var(${cssVarName(token)})`] as const,
  );
  // Seguro: `entries` cubre exactamente las claves de `ThemeColors` (viene de
  // `Object.keys` sobre un objeto con esa forma) — `fromEntries` no puede
  // expresar eso en su tipo genérico.
  return Object.fromEntries(entries) as unknown as ThemeColors;
}

// Un solo objeto para ambos temas a propósito: en web el rol siempre resuelve
// al mismo `var(...)`; es la variable la que cambia de valor según
// `data-theme`, no el objeto de colores que React usa.
const cssVarColors = makeCssVarColors();

export const lightColors = cssVarColors;
export const darkColors = cssVarColors;
