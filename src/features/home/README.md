# features/home/

La ruta de aprendizaje (roadmap pedagógico). Hoy: Etapas 1 y 2 en la ruta, con
lección solo en los Módulos 1 y 2 (el resto, "Próximamente").

- `screens/HomeScreen` — tarjeta fija por etapa (`StageBanner`) y un
  `ModuleRow` por módulo: círculo que se abre en tarjeta con Teoría y
  Ejercicios. Nada se bloquea.
- `screens/TheoryScreen` — hasta 3 hojas (`components/theory/theoryPages.ts`)
  con pie ← n → (`TheoryPager`); definiciones con `TooltipHost`.
- `screens/PracticeScreen` → `PracticeResultScreen` — 15 ejercicios y su
  resultado; cada mecánica tiene su vista en `components/practice/`.
- `hooks/useClipPlayer` — hace sonar los `Clip` del dominio (piano o
  metrónomo) y avisa de cada evento para encender la luz o la ficha.
- `progressStore.ts` — progreso persistido con MMKV.

Lo que se pregunta y qué es correcto vive en
`domain/lessons/`. Decisiones pedagógicas: `docs/roadmap/etapa-1/`.
