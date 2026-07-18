import type { TextStyle } from 'react-native';

/**
 * Tokens de diseño independientes del tema (no cambian entre claro y oscuro).
 * El color vive aparte, en `colors.ts`, y se resuelve por tema vía `useTheme()`.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Relieve (labio inferior) de los botones estilo Duolingo. */
export const elevation = {
  /** Alto del labio en reposo; al presionar se colapsa a 0. */
  buttonLip: 4,
} as const;

/**
 * Tipografía. Duolingo usa una fuente redondeada muy gruesa; sin esa fuente
 * embebida usamos la del sistema con pesos altos para el mismo carácter.
 */
export const typography = {
  headerTitle: { fontSize: 20, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, fontWeight: '500' },
  sectionLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  chip: { fontSize: 15, fontWeight: '700' },
  note: { fontSize: 18, fontWeight: '800' },
  caption: { fontSize: 12, fontWeight: '600' },
  tabLabel: { fontSize: 11, fontWeight: '700' },
} as const satisfies Record<string, TextStyle>;
