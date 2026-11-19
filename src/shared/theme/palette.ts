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
  // Tints de selección: velo suave del color de marca sobre la superficie.
  // Son hex OPACOS a propósito: la cara del botón tapa el labio 3D, y un rgba
  // translúcido dejaría ver el labio oscuro a través de toda la cara.
  purpleTintLight: '#FAF5FE',
  purpleTintDark: '#33364F',
  purpleTextDark: '#CBA6F0',

  // Azul secundario (Macaw) — nivel de jerarquía por debajo del morado
  blue: '#1CB0F6',
  // Labio 3D del azul secundario (Macaw oscuro de Duolingo). Es el MISMO en
  // claro y oscuro: un labio "más claro que la cara" se ve como un borde
  // blanco y rompe el relieve.
  blueShadow: '#1899D6',
  blueTintLight: '#F1FAFE',
  blueTextLight: '#1691D4',
  blueTintDark: '#203E4D',
  blueTextDark: '#7FD0F8',

  // Verde de acierto (Feather Green de Duolingo). En Raksound NO es color de
  // marca: se reserva para "respuesta correcta" y para la dificultad más baja.
  green: '#58CC02',
  greenShadow: '#58A700',
  greenTintLight: '#F0FBE6',
  // Fondo del panel de acierto: el verde claro de Duolingo. Más presente que
  // el tint (que es un velo para superficies), sin llegar al color entero.
  greenPanel: '#DFF5C6',
  greenTextLight: '#4CA300',
  greenTintDark: '#22331C',
  greenTextDark: '#93E64D',

  // Rojo de error (Cardinal)
  red: '#FF4B4B',
  redShadow: '#E63939',
  redTintLight: '#FFF0F0',
  /** Fondo del panel de fallo, en el mismo registro que `greenPanel`. */
  redPanel: '#FFE0E1',
  redTextLight: '#E02B2B',
  redTintDark: '#3A2224',
  redTextDark: '#FF9A9A',

  // Amarillo de dificultad media (Bee)
  yellow: '#FFC800',
  yellowShadow: '#E0A800',
  yellowTintLight: '#FFF9E5',
  yellowTextLight: '#B58500',
  yellowTintDark: '#3A3016',
  yellowTextDark: '#FFD84D',
  /** Fondo del panel de "casi", en el mismo registro que `greenPanel`. */
  yellowPanel: '#FFF3C4',
  /** Texto sobre el panel ámbar: el amarillo puro no se lee sobre él. */
  yellowPanelText: '#B07B00',

  // Rosa de acento: color de una etapa de la ruta del Home (las etapas no usan
  // el morado de marca, que ya es el de la cabecera, ni el dorado del progreso).
  pink: '#E85BBF',
  pinkShadow: '#C2459C',
  pinkTintLight: '#FDF0F9',
  pinkTextLight: '#C2459C',
  pinkTintDark: '#3D2537',
  pinkTextDark: '#F5A3DC',

  /** Fondo del panel de "perfecto": velo del morado de marca. */
  purplePanel: '#F0E2FD',

  // Teclado de piano dibujado en la app (corrección de entonación).
  ivory: '#FFFFFF',
  ebony: '#2B2B2B',
  ebonyEdge: '#111111',

  // Metrónomo dibujado en la app: nogal, escala crema, latón y acero.
  walnutLight: '#BC7A50',
  walnut: '#9C5C38',
  walnutDark: '#7A4426',
  walnutLip: '#58301A',
  cream: '#F8EBD0',
  creamShade: '#EAD5AB',
  brass: '#E8BE60',
  steelDark: '#9CA8B0',

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

  /** Brillo interior de la barra de progreso: un velo claro sobre el relleno. */
  shine: 'rgba(255, 255, 255, 0.45)',
  /** Velo oscuro tras un diálogo modal. */
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;
