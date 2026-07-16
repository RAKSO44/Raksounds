import type { TextStyle } from 'react-native';

/**
 * Tokens de diseño — única fuente de verdad visual.
 * Los componentes nunca hardcodean colores, tamaños ni tipografía.
 */

export const colors = {
  background: '#FFFFFF',
  surface: '#F4F4F8',
  surfacePressed: '#E9E9F0',
  border: '#E2E2EA',
  textPrimary: '#1C1C24',
  textSecondary: '#6C6C78',
  accent: '#5B5BD6',
  accentPressed: '#4949BE',
  onAccent: '#FFFFFF',
} as const;

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
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 18, fontWeight: '700' },
  caption: { fontSize: 12 },
} as const satisfies Record<string, TextStyle>;
