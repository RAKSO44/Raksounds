# Sistema de diseño — referencia Duolingo (OBLIGATORIO)

Toda la UI de Raksound sigue la estética de **Duolingo**. Nunca construyas una
interfaz genérica: antes de crear cualquier pantalla o componente, piensa "¿cómo
lo haría Duolingo?" (colores vivos, formas redondeadas, botones con relieve 3D,
tipografía gruesa, microinteracciones con háptica).

## 1. Reutiliza los componentes existentes — no reinventes botones

Antes de crear un botón, chip, tarjeta o control, **revisa `shared/design-system/`
y reutiliza**. Solo se crea uno nuevo si ninguno encaja, y se agrega ahí (no
suelto en un feature).

- **`PushButton`** — botón con "labio" inferior 3D estilo Duolingo. Dos variantes:
  - `variant="solid"` → botón "entero": color de marca fijo (igual en claro y
    oscuro), sin estado seleccionado, solo presionado. Úsalo para acciones/ítems
    de color pleno (p. ej. las notas musicales).
  - `variant="selectable"` → botón "transparente": neutro en reposo, cambia al
    color de marca al seleccionarse. Úsalo para selectores de nivel principal.
- **`GroupedOptionList`** — lista agrupada (una tarjeta con filas + divisores,
  fila activa resaltada con el **acento secundario**). Es una jerarquía **por
  debajo** de los `PushButton`. Úsala para opciones relacionadas entre sí de
  nivel secundario. La fila activa es **full-bleed, integrada al grupo** (como
  Duolingo, no un recuadro flotando con margen interno): la tarjeta no lleva
  padding y recorta con `overflow: 'hidden'`; las filas van a ras del borde sin
  radio propio y los extremos redondean sus esquinas exteriores para seguir la
  curva del grupo; el divisor que toca la fila activa se oculta para que el borde
  de color se funda con la agrupación.
- **`SectionCard`** — tarjeta de sección (ícono + título, control opcional a la
  altura del título y contenido debajo). Es el contenedor de Configuración y
  Créditos; vive en `shared/` porque lo usan 2+ features.
- **`ConfirmDialog`** — diálogo modal para una acción que se pierde si se hace
  sin querer (abandonar una ronda). Dos `PushButton`: el destructivo en rojo
  (`solid`) y el de quedarse como `selectable` neutro.
- **`Header`** — cabecera morada que pinta el área de la status bar. Con
  `onBack` muestra una flecha de volver a la izquierda del título.
- **`DuolingoTabBar`** — barra inferior solo con íconos (sin texto), íconos
  redondeados y juguetones (`MaterialCommunityIcons`).

`PushButton` acepta un `icon` opcional (nombre de `MaterialCommunityIcons`) que
se pinta encima del label con el color del texto del botón. Para un **selector
tipo segmento donde el elegido va "a color entero"** (p. ej. el modo de
apariencia en Configuración), no uses el estado `selected` tenue: renderiza el
botón activo con `variant="solid"` y los inactivos con `variant="selectable"`.
Así el seleccionado queda morado pleno con texto blanco y el resto neutros, sin
perder el relieve 3D ni el snap instantáneo.

Para un **interruptor on/off** usa el `Switch` nativo tematizado con tokens
(`trackColor` en `colors.brand` al estar activo, `thumbColor` en
`colors.textOnBrand`), agrandado con `transform: scale`, y dispara
`hapticPressIn` al cambiar. Va a la altura del título de su sección, pegado al
extremo derecho (no en una fila aparte debajo). No hay toggle propio en el
design system todavía; si se repite en otra feature, se extrae aquí.

Jerarquía visual: **PushButton (primario)** > **GroupedOptionList (secundario)**.
No uses dos primarios compitiendo; baja de nivel con la lista agrupada.

## 2. Comportamiento de los botones (no lo cambies)

- Relieve 3D: la cara se apoya sobre un "labio" más oscuro (marca) o de borde
  visible (neutro).
- Al presionar, la cara baja y tapa el labio; al soltar, vuelve. **Ambos snaps
  son INSTANTÁNEOS** — sin animación de presionado ni de soltado.
- Háptica firme SOLO al presionar (`hapticPressIn`): un único golpe seco por
  pulsación; al soltar NO hay háptica. Vía `shared/haptics/` (expo-haptics;
  usa el mejor actuador del equipo).
- El gesto va con **react-native-gesture-handler**, NO con `Pressable`. El
  sistema de responders de React Native concede el toque a un solo componente a
  la vez, así que con `Pressable` era imposible mantener dos botones pulsados
  (las notas no se podían tocar simultáneamente). No lo reviertas.
- **PROHIBIDO animar escala.** Nada de "crecer y volver": ni el pop al
  habilitarse un botón, ni la celebración de una respuesta correcta, ni
  muelles que se pasan del valor y rebotan. Es lo contrario del carácter de la
  app. Si algo tiene que notarse, se nota por COLOR o por un movimiento corto
  y direccional (el temblor lateral de un fallo, la barra que avanza), nunca
  por tamaño.
- Las animaciones que sí existen son cortas y con curva de salida
  (`Easing.out`), con las duraciones de `motion` en `shared/theme/tokens.ts`.
  `withSpring` no se usa en ningún sitio: su rebote es exactamente lo que no
  queremos.
- Tres callbacks: `onPressIn` (el dedo toca), `onPress` (tap completo, solo si
  el gesto no se canceló) y `onPressOut` (siempre, incluso al cancelarse). Para
  algo que debe sentirse inmediato —una tecla de piano— usa `onPressIn`, no
  `onPress`.

## 3. Colores — usa SIEMPRE los tokens del tema

Fuente de verdad: `shared/theme/` (`palette.ts` crudo → `colors.ts` semántico).
**Prohibido hardcodear** colores en componentes: consume siempre `useTheme()`.

- **Marca (primario): morado** — `#A560E8`, labio/oscuro `#8549BA`. Header,
  selectores principales y botones sólidos.
- **Secundario: azul** — `#1CB0F6`. Solo para la selección de nivel secundario
  (`GroupedOptionList`). Crea jerarquía frente al morado.
- **Neutros y modo oscuro**: tomados de la paleta real de Duolingo (Snow/Polar/
  Swan/Eel en claro; `#131F24`/`#202F36`/`#37464F` en oscuro).
- El **modo oscuro** es obligatorio y sigue la config del sistema
  (`userInterfaceStyle: automatic` + `ThemeProvider`/`useColorScheme`). Todo
  color nuevo se define en `colors.ts` para claro **y** oscuro.
- Ojo en oscuro: un labio "más oscuro que la superficie" se funde con el fondo;
  usa un tono con contraste real (ver `slateEdge`).

## 4. Tipografía, forma y espaciado

- La familia es **Poppins**. Los `.ttf` viven en `assets/fonts/` y se **embeben
  en el binario** con el plugin `expo-font` de `app.config.ts`; `useFonts` en
  `app/_layout.tsx` es solo para web, donde no hay binario. Cargarlas únicamente
  en tiempo de ejecución hace que Android mida cada texto con la fuente del
  sistema y lo pinte con Poppins (más ancha): el resultado son etiquetas
  recortadas ("Arpegi") y puntos suspensivos donde sobra espacio. Si se añade
  un peso nuevo hay que copiarlo a `assets/fonts/`, listarlo en el plugin y
  **volver a compilar** (`expo prebuild` + `expo run:android`).
- Los tokens de `typography` (`shared/theme/tokens.ts`) declaran `fontFamily`
  (`fonts.bold`, `fonts.extrabold`…) y **nunca** `fontWeight`: en React Native
  cada peso es un archivo distinto, y mezclar ambos hace que Android sintetice
  una negrita falsa.
- **PROHIBIDO truncar texto.** Nada de `numberOfLines` ni `ellipsizeMode` en
  ningún componente: un texto que no cabe se envuelve o hace crecer su caja,
  nunca sale con "…". Los contenedores de texto llevan `flexShrink: 0` para que
  un padre estrecho no pueda aplastarlos.
- Pesos altos (bold / extrabold) para el carácter grueso de Duolingo.
- Bordes redondeados (`radii`) y espaciado por tokens (`spacing`). Nunca números
  mágicos: si falta un token, se agrega al theme.
- Animaciones **sutiles y agradables** (reanimated): fundidos cortos y
  transiciones de layout breves. Nada de rebotes exagerados que distraigan.

## 5. Web (react-native-web) — misma identidad visual, SIEMPRE

Raksound corre también en navegador (ver "Soporte web" en
`.claude/rules/architecture.md`). La regla no tiene excepciones: **no existe
un "tema web"**. Colores de `colors.ts`, `radii`, `spacing`, `typography`, el
labio 3D de `PushButton` (snap instantáneo al presionar/soltar, sin
animación) y la háptica (que ya no-opea sola en web) son exactamente los
mismos que en iOS/Android. Si en algún momento un componente necesita verse
distinto en web, la pregunta correcta es "¿por qué el theme no alcanza?", no
"¿cómo lo bifurco con un `.web.tsx`".

Lo único que sí cambia en web es **layout**, y por ANCHO de pantalla, no por
plataforma:

- **Web abierta en un celular debe verse igual que la app nativa**: mismo tab
  bar inferior, misma columna angosta, mismo padding. No hay una versión
  "web mobile" distinta de la app.
- **Web en escritorio (ancho >= `breakpoints.wide`, 900px)**: la navegación
  pasa de tab bar inferior a riel lateral fijo (`DuolingoTabBar`, decidido
  por `useIsWideScreen()` de `shared/theme/`), reutilizando los mismos
  íconos/colores — no un componente de navegación distinto. El contenido de
  cada pantalla puede reorganizarse igual (columna centrada con `maxWidth`,
  grillas de más columnas) reutilizando siempre
  `PushButton`/`GroupedOptionList`/`Header`, nunca reinventándolos para web.
  Los breakpoints viven como tokens en `shared/theme/tokens.ts` (mismo lugar
  que `spacing`/`radii`), no como números sueltos en un componente.
- **Estados que solo existen con puntero/teclado** (hover, foco visible por
  Tab) son una EXTENSIÓN del lenguaje visual, no una desviación: si se agrega
  hover a un `PushButton`, debe ser sutil (p. ej. un leve cambio de opacidad
  o el mismo tono ligeramente resaltado) y nunca reemplazar el snap
  instantáneo de presionado ni la ausencia de animación al soltar. El foco de
  teclado necesita un anillo visible accesible — pendiente de definir su
  color/grosor como token cuando se aborde el layout de escritorio.
- `react-native-gesture-handler` y `react-native-reanimated` ya funcionan en
  web, así que `PushButton` no necesita una variante `.web.tsx`: el mismo
  gesto de `LongPress` que da el note-on inmediato en nativo funciona igual
  con click de mouse.

## 6. Regla de oro

Si vas a introducir un color, forma o interacción nueva, primero confirma que no
exista ya en el theme / design-system. Coherencia > novedad. Ante la duda,
imita a Duolingo y reutiliza lo que ya construimos.
