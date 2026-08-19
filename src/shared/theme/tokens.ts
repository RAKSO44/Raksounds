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

/** Medidas de controles que se repiten entre pantallas de ejercicios. */
export const controls = {
  /** Alto de la barra de progreso de una ronda. */
  progressBarHeight: 16,
  /** Ancho mínimo de las teclas grandes (nota base y nota a adivinar). */
  noteTileSize: 104,
  /** Amplitud (px) del temblor de una respuesta incorrecta. */
  shakeDistance: 6,
  /** Alto del "brillo" interior de la barra de progreso (estilo Duolingo). */
  progressShineHeight: 5,
  /** Separación del brillo respecto al borde superior del relleno. */
  progressShineInset: 3,
  /** Padding vertical de la cara de un botón compacto (la acción principal). */
  compactButtonPaddingY: 10,
  /** Diámetro del disco con el icono de la hoja de corrección. */
  feedbackBadgeSize: 36,
  /** Separación entre el icono de una estadística del resumen y su cifra. */
  statIconGap: 12,
  /** Ancho de la columna vertical del modo mixto en el menú de Ejercicios. */
  verticalOptionWidth: 56,
} as const;

/** Duraciones (ms) de las animaciones. Cortas y directas, nunca rebotes. */
export const motion = {
  /** Fundido de entrada de un elemento nuevo. */
  enter: 220,
  /** Salida / transición de layout. */
  exit: 140,
  /** Retardo entre elementos de una entrada escalonada. */
  stagger: 60,
  /** Medio ciclo del temblor de una respuesta incorrecta. */
  shake: 50,
  /** Avance de la barra de progreso de la ronda. */
  progress: 260,
  /** Subida/bajada de la hoja inferior de corrección. */
  sheet: 220,
} as const;

/**
 * Breakpoints de layout (no de plataforma: web en un celular se queda por
 * debajo de `wide` y se ve igual que la app nativa — ver
 * `.claude/rules/architecture.md`, sección "Soporte web").
 */
export const breakpoints = {
  /** A partir de este ancho (px) la navegación pasa de tab bar inferior a
   *  riel lateral (`useIsWideScreen`). */
  wide: 900,
} as const;

export const navigation = {
  /** Ancho del riel lateral que reemplaza al tab bar inferior en pantallas
   *  de ancho >= `breakpoints.wide`. */
  railWidth: 88,
} as const;

/**
 * Familias tipográficas. Poppins (la misma que usa el resto del ecosistema)
 * embebida con `expo-font`: en React Native el peso NO se aplica sobre la
 * familia, cada peso es un archivo propio, así que los estilos declaran
 * `fontFamily` y nunca `fontWeight` (si no, Android sintetiza una negrita
 * falsa sobre la variante regular).
 */
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
} as const;

/** Tipografía. Pesos altos para el carácter grueso de Duolingo. */
export const typography = {
  headerTitle: { fontSize: 20, fontFamily: fonts.extrabold },
  title: { fontSize: 26, fontFamily: fonts.extrabold },
  subtitle: { fontSize: 14, fontFamily: fonts.medium },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chip: { fontSize: 15, fontFamily: fonts.bold },
  note: { fontSize: 18, fontFamily: fonts.extrabold },
  /** Nota grande de una tecla de ejercicio (y el "?" de la nota oculta). */
  noteLarge: { fontSize: 32, fontFamily: fonts.extrabold },
  /** Enunciado de un ejercicio ("¿Cuál de estas es su 5ª justa?"). */
  question: { fontSize: 17, fontFamily: fonts.bold },
  /** Cifra destacada de una estadística del resumen. */
  stat: { fontSize: 24, fontFamily: fonts.extrabold },
  /** Cifra principal del resumen de una ronda (el porcentaje de aciertos). */
  heroValue: { fontSize: 52, fontFamily: fonts.extrabold },
  caption: { fontSize: 12, fontFamily: fonts.semibold },
  tabLabel: { fontSize: 11, fontFamily: fonts.bold },
} as const satisfies Record<string, TextStyle>;
