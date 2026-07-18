/**
 * Paleta cruda inspirada en el sistema de color de Duolingo.
 *
 * Estos son los valores "físicos" (nombres de color, no roles). Los componentes
 * NUNCA los usan directamente: consumen los roles semánticos de `colors.ts` a
 * través de `useTheme()`. Así el mismo componente sirve en claro y oscuro.
 *
 * El verde de Duolingo se reemplaza por un morado de marca (decisión de
 * Raksound), manteniendo la misma lógica de "color + labio más oscuro".
 */
export const palette = {
  // Neutros (nombres tomados del sistema de Duolingo)
  snow: '#FFFFFF',
  polar: '#F7F7F7',
  swan: '#E5E5E5',
  swanShadow: '#D4D4D4',
  hare: '#AFAFAF',
  wolf: '#777777',
  eel: '#4B4B4B',

  // Morado de marca (reemplaza al Feather Green)
  purple: '#A560E8',
  purpleShadow: '#8549BA',
  purpleTintLight: '#F1E4FB',
  purpleTintDark: '#3A2A52',
  purpleTextDark: '#CBA6F0',

  // Azul secundario (Macaw) — nivel de jerarquía por debajo del morado
  blue: '#1CB0F6',
  blueTintLight: '#DDF4FF',
  blueTextLight: '#1691D4',
  blueTintDark: '#0F2E3D',
  blueTextDark: '#7FD0F8',

  // Neutros del modo oscuro de Duolingo
  midnight: '#131F24',
  slate: '#202F36',
  // Labio 3D en oscuro: un tono más claro que la superficie, porque cualquier
  // sombra más oscura se confundiría con el fondo casi negro y no se vería.
  slateEdge: '#2E3D45',
  steel: '#37464F',
  fog: '#8FA3AD',
  dim: '#5C7079',

  white: '#FFFFFF',
} as const;
