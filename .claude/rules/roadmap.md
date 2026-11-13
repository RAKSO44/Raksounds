# Roadmap pedagógico (Home) — EN PREPARACIÓN, no implementar todavía

El documento fuente es `docs/roadmap/roadmap.md`: visión, metodología
(microlecciones estilo Duolingo), las 5 etapas / 23 módulos y la forma de
trabajo. **Léelo entero antes de tocar cualquier cosa del roadmap.**

Estado: el usuario está preparando el roadmap. Hasta que pida explícitamente
trabajar un módulo concreto, `home/` sigue siendo placeholder (ver CLAUDE.md).

## Reglas que no se negocian (resumen del documento)

- Se trabaja **un módulo (o parte de uno) a la vez**, solo el pedido. No
  desarrollar módulos de forma automática ni inventar contenido educativo de
  módulos que no se están trabajando.
- **Módulo ≠ microlección.** Un módulo se divide en tantas microlecciones como
  haga falta; cada microlección introduce 1–3 conceptos (idealmente 1–2).
- Estructura de microlección: explicación breve (1–2 páginas) → ejemplo →
  práctica (~15 ejercicios, referencia, no regla) → refuerzo.
- **Repetición con variedad controlada**: la mecánica principal se mantiene
  estable en toda la lección; la variación refuerza, no introduce conceptos.
  Una microlección NO es un examen.
- Dificultad gradual y prerrequisitos respetados: nunca usar un concepto que
  aún no se enseñó.
- Feedback inmediato con corrección breve y útil.
- Oído relativo integrado desde el inicio (nota de referencia de la app);
  nunca exigir oído absoluto.
- No enseñar instrumentos, técnica vocal ni acústica: el teclado es solo una
  herramienta didáctica.
- Ninguna mecánica nueva sin justificación pedagógica. Si falta una decisión
  pedagógica importante, **preguntar antes de asumirla**.
- La lista de ejercicios propuestos por módulo no es definitiva. Las decisiones
  tomadas durante el desarrollo prevalecen sobre el documento; cuando se tome
  una, documentarla en `docs/roadmap/` (p. ej. un archivo por módulo).

## Flujo por módulo

1. Elegir módulo → 2. conceptos y prerrequisitos → 3. dividir en
microlecciones → 4. diseñar explicación → 5. definir ejercicios repetitivos →
6. implementar → 7. probar progresión, respuestas y feedback → 8. revisar y
ajustar antes de seguir. Cada módulo debe poder probarse sin los posteriores.

## Encaje con la arquitectura (cuando se empiece)

- Contenido y generación de ejercicios → `domain/` (TS puro, testeado), igual
  que `domain/ear-training/`. La UI de lecciones → `features/home/`.
- Reutilizar lo que ya existe antes de crear: generadores de
  `domain/ear-training/` (intervalos ≈ Módulos 8 y 10), `music-theory/`
  (escalas/arpegios ≈ Módulos 11, 13, 18), `AnswerOption`,
  `AnswerFeedbackSheet`, `ExerciseProgressBar`, `RoundSummaryView` (mover a
  `shared/` si pasan a usarse desde 2 features).
