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
- **`Header`** — cabecera de marca que cubre el área de la status bar.
- **`DuolingoTabBar`** — barra inferior solo de íconos (juguetones), sin texto.
