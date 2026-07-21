# shared/design-system/

Componentes base reutilizables, **100% propios** (sin frameworks de estilos:
ni NativeWind, ni Tamagui — decisión de diseño del proyecto).

Se estilizan con `StyleSheet` de React Native y consumen tokens/colores de
`src/shared/theme/` (siempre vía `useTheme()`, nunca colores hardcodeados).

La estética es **Duolingo**; ver `.claude/rules/design-system.md`. Antes de crear
un control nuevo, reutiliza estos:

- **`PushButton`** — botón con "labio" 3D. `variant="solid"` (color entero fijo,
  p. ej. notas) o `variant="selectable"` (neutro → marca al seleccionarse, p. ej.
  selectores principales). Snap instantáneo al presionar y al soltar + háptica.
- **`GroupedOptionList`** — lista agrupada (tarjeta con filas + divisores, fila
  activa en el acento secundario). Jerarquía **por debajo** de `PushButton`.
- **`SectionCard`** — tarjeta de sección: ícono + título, un control opcional a
  la altura del título (`headerRight`) y contenido debajo (`children`).
- **`Slider`** — deslizable de 0 a 1 sin perilla y de grosor constante. Es
  **relativo**: apoyar el dedo no mueve nada; el valor sigue el desplazamiento
  del arrastre desde donde estaba la barra. `detent` opcional para un valor
  imán. El arrastre vertical se deja pasar para no romper el scroll.
- **`Header`** — cabecera de marca que cubre el área de la status bar. Con
  `onBack` muestra la flecha de volver.
- **`DuolingoTabBar`** — barra inferior solo de íconos (juguetones), sin texto.
