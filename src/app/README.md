# app/ (Expo Router)

Rutas basadas en archivos — reemplaza el `navigation/RootNavigator.tsx` del diseño
original (decisión 2026-07: Expo Router es la recomendación oficial de Expo).

Los archivos de ruta son **wrappers finos**: la UI real vive en `src/features/*/screens/`.
Aquí no va lógica de negocio ni de presentación.

- `_layout.tsx` — layout raíz.
- `(tabs)/_layout.tsx` — bottom tabs: Home (`index`, inicial), Librería
  (`library`), Ejercicios y Perfil (placeholder).
- `exercise/*` y `lesson/*` — rondas de Ejercicios y lecciones del Home, fuera
  de las tabs para que no se abandonen por accidente.
