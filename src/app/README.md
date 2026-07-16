# app/ (Expo Router)

Rutas basadas en archivos — reemplaza el `navigation/RootNavigator.tsx` del diseño
original (decisión 2026-07: Expo Router es la recomendación oficial de Expo).

Los archivos de ruta son **wrappers finos**: la UI real vive en `src/features/*/screens/`.
Aquí no va lógica de negocio ni de presentación.

- `_layout.tsx` — layout raíz.
- `(tabs)/_layout.tsx` — bottom tabs: Librería (inicial), Home, Perfil.
