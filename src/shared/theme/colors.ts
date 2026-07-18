import { palette } from './palette';

/**
 * Roles de color semánticos. Cada tema (claro/oscuro) define los mismos roles,
 * de modo que los componentes solo conocen el rol ("brand", "surface") y nunca
 * el valor concreto ni el tema activo.
 */
export interface ThemeColors {
  /** Fondo de pantalla. */
  background: string;
  /** Superficie de tarjetas y botones "transparentes" en reposo. */
  surface: string;
  /** Labio inferior 3D de los botones neutros (efecto Duolingo). */
  surfaceShadow: string;
  /** Bordes y separadores. */
  border: string;

  textPrimary: string;
  textSecondary: string;
  /** Texto sobre el color de marca (siempre legible). */
  textOnBrand: string;

  /** Color de marca (morado). Cara de los botones sólidos y del header. */
  brand: string;
  /** Labio inferior 3D de los botones de marca. */
  brandShadow: string;
  /** Fondo tenue de un selector "transparente" cuando está seleccionado. */
  brandTint: string;
  /** Texto de un selector seleccionado. */
  brandText: string;

  /** Acento secundario (jerarquía por debajo de la marca). */
  secondary: string;
  /** Fondo tenue de una opción secundaria seleccionada. */
  secondaryTint: string;
  /** Texto de una opción secundaria seleccionada. */
  secondaryText: string;

  /** Barra de navegación inferior. */
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
}

export const lightColors: ThemeColors = {
  background: palette.snow,
  surface: palette.white,
  surfaceShadow: palette.swan,
  border: palette.swan,

  textPrimary: palette.eel,
  textSecondary: palette.wolf,
  textOnBrand: palette.white,

  brand: palette.purple,
  brandShadow: palette.purpleShadow,
  brandTint: palette.purpleTintLight,
  brandText: palette.purpleShadow,

  secondary: palette.blue,
  secondaryTint: palette.blueTintLight,
  secondaryText: palette.blueTextLight,

  tabBar: palette.white,
  tabBarBorder: palette.swan,
  tabActive: palette.purple,
  tabInactive: palette.hare,
};

export const darkColors: ThemeColors = {
  background: palette.midnight,
  surface: palette.slate,
  surfaceShadow: palette.slateEdge,
  border: palette.steel,

  textPrimary: palette.white,
  textSecondary: palette.fog,
  textOnBrand: palette.white,

  // El morado de marca se mantiene idéntico en oscuro (botones "enteros").
  brand: palette.purple,
  brandShadow: palette.purpleShadow,
  brandTint: palette.purpleTintDark,
  brandText: palette.purpleTextDark,

  secondary: palette.blue,
  secondaryTint: palette.blueTintDark,
  secondaryText: palette.blueTextDark,

  tabBar: palette.midnight,
  tabBarBorder: palette.steel,
  tabActive: palette.purple,
  tabInactive: palette.dim,
};
