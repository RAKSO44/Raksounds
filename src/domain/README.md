# domain/

Lógica de negocio pura de Raksound. **Regla de oro: TypeScript puro.**

- ❌ Prohibido importar `react`, `react-native`, `expo` o cualquier componente de UI.
- ✅ Solo funciones puras y tipos. 100% testeable con Jest sin emulador.
- ESLint aplica esta regla automáticamente (`no-restricted-imports`).

Subcarpetas:

- `music-theory/` — notas, fórmulas de escalas/arpegios, construcción de escalas.
- `audio/` — interfaz `IAudioPlayer` (contrato, sin implementación).
