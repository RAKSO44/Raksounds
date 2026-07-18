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
  nivel secundario.
- **`Header`** — cabecera morada que pinta el área de la status bar.
- **`DuolingoTabBar`** — barra inferior solo con íconos (sin texto), íconos
  redondeados y juguetones (`MaterialCommunityIcons`).

Jerarquía visual: **PushButton (primario)** > **GroupedOptionList (secundario)**.
No uses dos primarios compitiendo; baja de nivel con la lista agrupada.

## 2. Comportamiento de los botones (no lo cambies)

- Relieve 3D: la cara se apoya sobre un "labio" más oscuro (marca) o de borde
  visible (neutro).
- Al presionar, la cara baja y tapa el labio; al soltar, vuelve. **Ambos snaps
  son INSTANTÁNEOS** — sin animación de presionado ni de soltado.
- Háptica firme al presionar (`hapticPressIn`) y al soltar (`hapticPressOut`),
  vía `shared/haptics/` (expo-haptics; usa el mejor actuador del equipo).

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

- Pesos altos (`700`–`800`) para el carácter grueso de Duolingo; tokens en
  `typography` (`shared/theme/tokens.ts`).
- Bordes redondeados (`radii`) y espaciado por tokens (`spacing`). Nunca números
  mágicos: si falta un token, se agrega al theme.
- Animaciones **sutiles y agradables** (reanimated): fundidos cortos y
  transiciones de layout breves. Nada de rebotes exagerados que distraigan.

## 5. Regla de oro

Si vas a introducir un color, forma o interacción nueva, primero confirma que no
exista ya en el theme / design-system. Coherencia > novedad. Ante la duda,
imita a Duolingo y reutiliza lo que ya construimos.
