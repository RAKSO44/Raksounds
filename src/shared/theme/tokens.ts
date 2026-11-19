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
  /** Labio de los nodos de la ruta del Home: más grueso, para que su color se lea. */
  nodeLip: 6,
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
  /** Lado del botón de micrófono en reposo (cuadrado, como en Duolingo). */
  micButtonSize: 88,
  /** Ancho del botón de micrófono al escuchar (se ensancha a una píldora). */
  micButtonWideWidth: 200,
  /** Barras de volumen del micrófono: grosor y alturas mínima y máxima. */
  micBarWidth: 8,
  micBarMinHeight: 8,
  micBarMaxHeight: 40,
  /** Diámetro de los puntos del micrófono preparándose o deshabilitado. */
  micDotSize: 8,
  /** Teclado de piano: ancho máximo de una tecla blanca y alto del teclado. */
  pianoWhiteKeyMaxWidth: 44,
  pianoHeight: 148,
  /** Alto de las teclas negras respecto al de las blancas. */
  pianoBlackKeyRatio: 0.62,
  /** Labio 3D de las teclas (más fino que el de un botón: son muchas y juntas). */
  pianoKeyLip: 3,
  /** Alto de la flecha que señala la nota pedida bajo el teclado. */
  pianoArrowSize: 28,
  /** Barra de afinación: grosor del canal y de la marca, y alto de la marca. */
  gaugeTrackHeight: 12,
  gaugeMarkerWidth: 6,
  gaugeMarkerHeight: 32,
  /** Raya fina que marca el centro exacto (0 cents). */
  gaugeTickWidth: 2,
  /** Alto de la barra de la cabecera (sin contar la status bar). */
  headerHeight: 64,
  /** Ruta del Home: diámetro de un nodo de módulo. */
  moduleNodeSize: 76,
  /** Ancho de cada botón (Teoría, Práctica) de la tarjeta de un módulo. */
  moduleCardButtonWidth: 64,
  /** Grosor de la línea que separa dos etapas en la ruta. */
  stageDividerStroke: 2,
  /** Ancho máximo de la columna de la ruta en pantallas anchas. */
  pathMaxWidth: 560,
  /** Lado de la punta del globo de una definición (teoría). */
  tooltipArrowSize: 16,
  /** Borde del globo de una definición (y de su punta). */
  tooltipBorder: 2,
  /** Alto de las teclas blancas dibujadas en la teoría. */
  theoryKeyHeight: 128,
  /** Grosor de la llave que une dos teclas en la teoría. */
  bracketStroke: 3,
  /** Escalera DO…SI: alto de la primera ficha y cuánto sube cada una. */
  stepTileMinHeight: 48,
  stepTileRise: 12,
  /** Ficha de una fila de nombres de nota (con o sin hueco). */
  noteCellSize: 60,
  /** Ancho mínimo de un botón de escuchar que es solo el parlante. */
  listenButtonMinWidth: 96,
  /** Luz del pulso: el círculo que destella con cada golpe. */
  pulseLightSize: 96,
  /** Marcas de pulso bajo la luz (una por golpe). */
  beatMarkSize: 14,
  /** Alto del botón TAP. */
  tapPadHeight: 112,
  /** Ícono de una lista de comprobación de la teoría ("Nota que: ✓ …"). */
  theoryCheckIconSize: 22,
  /** Corazón del pulso (teoría del Módulo 2). */
  pulseHeartSize: 88,
  /** Cuánto "late" el corazón: crece y vuelve (golpe débil / fuerte). */
  heartBeatScale: 1.1,
  heartAccentScale: 1.2,
  /** Distancia que recorre un "BUM" al salir del corazón. */
  bumTravel: 56,
  /** Línea del pulso (el "oxímetro"): alto, grosor de las marcas y su alto débil/fuerte. */
  pulseTraceHeight: 48,
  pulseTickWidth: 4,
  pulseTickHeight: 20,
  pulseAccentTickHeight: 44,
  pulseTraceStroke: 2,
  /**
   * Slider de BPM (estilo Material 3): canal grueso partido por un tirador de
   * barra vertical, con un hueco a cada lado y un punto al final del canal.
   */
  sliderTrackHeight: 16,
  sliderHandleWidth: 4,
  sliderHandleHeight: 44,
  sliderHandleGap: 6,
  /** Radio de los extremos del canal que dan al tirador (los de fuera son píldora). */
  sliderInnerRadius: 4,
  sliderStopSize: 6,
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
  /** Ensanchado del micrófono de cuadrado a píldora (y vuelta). */
  micResize: 180,
  /** Fundido del contenido del micrófono (ícono, puntos) antes/después de ensancharse. */
  micContent: 90,
  /** Recorrido de la marca de la barra de afinación hasta su lectura. */
  gauge: 420,
  /** Suavizado de las barras de volumen entre un bloque de audio y el siguiente. */
  micLevel: 80,
  /** Apagado de la luz del pulso tras cada golpe (se enciende de golpe). */
  flash: 180,
  /** Latido del corazón: subida rápida y vuelta con curva de salida. */
  heartRise: 70,
  heartFall: 200,
  /** Vuelo de un "BUM" desde el corazón hasta desvanecerse. */
  bum: 650,
  /** Lo que tarda una marca en cruzar la línea del pulso, a velocidad constante. */
  traceCross: 2400,
  /** Un nodo de la ruta se abre en tarjeta (o vuelve a círculo). */
  morph: 300,
  /** Cambio de color de un nodo al completar su teoría o su práctica. */
  statusChange: 520,
  /** Destello que cruza el nodo tras ese cambio. */
  shine: 700,
  /** Pausa antes de que el resultado sume lo recuperado en "Reintentar fallos". */
  scoreGainDelay: 600,
  /** Cada paso del contador del resultado al sumar lo recuperado (+1). */
  scoreTick: 140,
  /** Cambio de color de la tarjeta de etapa al pasar a otra etapa. */
  stageColor: 220,
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
  /** Texto corrido de la teoría: legible, con aire entre líneas. */
  body: { fontSize: 17, lineHeight: 26, fontFamily: fonts.medium },
  caption: { fontSize: 12, fontFamily: fonts.semibold },
  /** Frase de un globo de definición: corta y un poco más grande que el texto chico. */
  tooltip: { fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold },
  tabLabel: { fontSize: 11, fontFamily: fonts.bold },
} as const satisfies Record<string, TextStyle>;
