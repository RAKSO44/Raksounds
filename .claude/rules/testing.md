# Testing

- Los tests viven junto al código, en `__tests__/` dentro del módulo.
- `domain/`: todo archivo nuevo o modificado lleva tests unitarios puros de
  Jest (sin mocks de React Native — si hace falta mockear RN ahí, la
  arquitectura está rota).
- Componentes: React Native Testing Library v14 — `render` es **async**,
  siempre `await render(...)`. Testear comportamiento visible (textos, taps),
  no detalles de implementación.
- `infrastructure/`: se testea contra la interfaz de `domain/`; el módulo
  nativo se mockea.
- Antes de dar por cerrada una tarea: `npx jest` + `npx tsc --noEmit` +
  `npx eslint src` deben pasar limpios.
- No perseguir % de cobertura: cubrir reglas de negocio y casos borde
  (enarmonías, cruces de octava, dobles alteraciones) vale más que cubrir
  wrappers triviales.
