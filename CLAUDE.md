# Raksound — Contexto del proyecto

## Qué es Raksound

App móvil (Android primero, con visión multiplataforma) para que estudiantes de **canto**
practiquen escalas musicales y entrenen el oído. NO es una app para aprender un
instrumento: el objetivo es que el usuario aprenda la **sonoridad** de escalas y
arpegios, y pueda reproducirlos con su propia voz de forma precisa. La teoría del Home
sí enseña la base para leer partitura (pentagrama, figuras, charts rítmicos), sin
llegar a lo complejo.

## Alcance ACTUAL (MVP) — léelo con atención

Hay cuatro secciones construidas: **Home** ("Inicio": ruta de aprendizaje,
con lección en los Módulos 1, 2 y 3), **Librería**, **Ejercicios**
(auditivos y de entonación) y **Configuración** (ya no es pestaña: se abre
desde el engranaje de la cabecera del Home, ruta `/settings`).
NO implementes todavía:

- Autenticación ni base de datos (llegará después, probablemente con Supabase)
- Contenido de los módulos del Home más allá del 3: se trabajan de uno en uno y
  solo cuando el usuario lo pida (`.claude/rules/roadmap.md`). En la ruta ya
  aparecen los Módulos 4–16 (Etapas 2 a 4) como "Próximamente", solo con su
  título y temario
- La sección "Perfil" (logros, diamantes, desbloqueables)
- Persistencia del progreso de los Ejercicios (rachas, historial de rondas):
  hoy el resultado de una ronda se muestra y se descarta. El progreso de los
  módulos del Home SÍ se guarda, en el dispositivo (MMKV)
- Grabación de la voz a archivo (la entonación solo ESCUCHA en vivo: los
  bloques del micrófono se analizan y se descartan)

Perfil existe como **placeholder** ("Próximamente") con su pestaña en el tab
bar, solo para que la arquitectura ya lo contemple.

## Qué hace cada sección (especificación en `docs/features/`)

Las reglas de negocio de cada sección viven en su documento; léelo antes de
tocarla y actualízalo cuando se tome una decisión nueva:

- **Home** (`docs/features/home.md`): ruta por etapas; cada módulo es un círculo
  que se estira hasta una tarjeta con Teoría y Ejercicios. **Nada se bloquea**:
  el progreso solo se indica en dorado. Decisiones pedagógicas en
  `docs/roadmap/etapa-1/modulos-1-2.md`.
- **Librería** (`docs/features/library.md`): escalas y arpegios desde
  cualquiera de las 12 notas; cada nota es un botón que suena con piano real.
- **Ejercicios** (`docs/features/exercises.md`): rondas auditivas (intervalo y
  nota, 7 niveles) y de entonación (se canta y el micrófono califica sin
  importar la octava).

## Arquitectura — REGLA DE ORO

`domain/` es TypeScript puro. **Nunca** debe importar nada de `react-native`, `expo`,
ni de componentes de UI. Es la lógica musical (notas, fórmulas de escalas, construcción de
escalas) y debe ser 100% testeable con Jest sin emulador ni dispositivo.

```
src/
  domain/          # TS puro: music-theory, ear-training, pitch, singing, lessons,
                   #   audio (solo interfaces)
  infrastructure/  # implementaciones nativas (audio, micrófono; .web.ts donde hace falta)
  features/        # home, library, exercises, settings, credits, profile (placeholder)
                   #   cada una: screens/ + components/ + hooks/ + index.ts
  shared/          # design-system, theme, navigation, haptics, settings
  app/             # rutas de Expo Router: wrappers finos que devuelven una screen
```

Dependencias entre capas, barrels y soporte web: `.claude/rules/architecture.md`.
(Decisión 2026-07: Expo Router en vez de React Navigation manual — es la recomendación
oficial de Expo y desde SDK 56 ya no depende de `@react-navigation/*`.)

Si en algún momento ves un import de `react-native` o `expo` dentro de `domain/`, algo
está mal — detente y avísame en vez de continuar.

## Stack técnico

- **Expo con Development Build** (no Expo Go — necesitamos módulos nativos de audio)
- TypeScript en modo `strict`
- **Expo Router** (file-based routing) para la navegación
- **react-native-audio-api** (Web Audio API nativa) como motor de sonido. NO un
  reproductor de medios: cada pulsación crea un `AudioBufferSourceNode` nuevo, que
  es como funcionan las apps de piano. Se probó `expo-audio` y no sirve para
  disparar muestras — ver `src/infrastructure/audio/README.md`
- Muestras de piano **Salamander Grand Piano** (Yamaha C5, CC BY). Los originales
  están en `assets/audio/piano/`; el banco cromático que consume la app se genera
  con `scripts/build-piano-samples.mjs`
- **react-native-gesture-handler** para las pulsaciones: el sistema de responders
  de React Native solo concede el toque a un componente a la vez, así que con
  `Pressable` era imposible pulsar varias notas a la vez
- Zustand para estado global (liviano, suficiente para el alcance actual; instalar cuando se use)
- **react-native-svg** para dibujos con formas o degradados (el metrónomo).
  `skewX` en vistas NO funciona en Android: no dibujar formas inclinadas así
- **Sin framework de estilos** (ni NativeWind ni similares): componentes 100% propios con
  `StyleSheet` y tokens en `shared/theme/`
- Tipografía **Poppins**: los `.ttf` viven en `assets/fonts/` y se embeben en el
  binario con el plugin `expo-font` de `app.config.ts` (`useFonts` en
  `app/_layout.tsx` solo hace falta para web). Cargarlas solo en runtime hace
  que Android mida los textos con la fuente del sistema y los recorte. Los
  tokens de `typography` declaran `fontFamily` y NUNCA `fontWeight`
- **Estética Duolingo + modo oscuro** obligatorios: la referencia visual es siempre
  Duolingo (nunca UI genérica), con morado de marca y azul secundario, y tema
  claro/oscuro según el sistema. Detalle y componentes reutilizables en
  `.claude/rules/design-system.md`
- Jest + React Native Testing Library (v14: `render` es **async**, siempre `await render(...)`)

## Base de datos (Supabase) — preparada, todavía sin usar

El proyecto de Supabase está conectado vía el MCP `supabase` (`.mcp.json`), pero la
persistencia sigue fuera del MVP: no se crean tablas hasta que el usuario lo pida.
Cuando se trabaje, **antes de crear o cambiar cualquier objeto** se usa la skill
`crear-sql-supabase` y se siguen las convenciones de `.claude/rules/base-de-datos.md`
(PascalCase entre comillas, datos en esquemas privados, la app solo llama funciones
del esquema `api`, RLS en toda tabla, migraciones versionadas en
`supabase/migrations/`). Toda escritura por el MCP pide aprobación (hook
`.claude/hooks/aprobar-escritura-supabase.mjs`).

## Créditos

El **único** lugar donde viven los créditos del proyecto es `docs/credits/credits.md`.
No crees `CREDITS.md` sueltos en `assets/` ni en ninguna otra carpeta: si hay que
acreditar algo nuevo (una muestra, una fuente, un colaborador), se agrega ahí y se
refleja en la pantalla de Créditos (`src/features/credits/`), que es lo que cumple la
atribución CC BY exigida por las muestras de piano.

## Estilo de código

- Componentes funcionales, hooks, sin clases
- Nombres de archivos: `PascalCase.tsx` para componentes, `camelCase.ts` para lógica
- Preferir funciones puras en `domain/`, sin efectos secundarios
- Comentarios solo donde la lógica musical no sea obvia (ej. por qué un semitono específico)
