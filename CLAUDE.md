# Raksound — Contexto del proyecto

## Qué es Raksound

App móvil (Android primero, con visión multiplataforma) para que estudiantes de **canto**
practiquen escalas musicales y entrenen el oído. NO es una app para leer partitura ni para
aprender un instrumento: el objetivo es que el usuario aprenda la **sonoridad** de escalas
y arpegios, y pueda reproducirlos con su propia voz de forma precisa.

## Alcance ACTUAL (MVP) — léelo con atención

Hay tres secciones construidas: **Librería**, **Ejercicios** (auditivos y de
entonación) y **Configuración**.
NO implementes todavía:

- Autenticación ni base de datos (llegará después, probablemente con Supabase)
- La sección "Home" (roadmap gamificado estilo Duolingo)
- La sección "Perfil" (logros, diamantes, desbloqueables)
- Persistencia del progreso de los ejercicios (rachas, historial de rondas):
  hoy el resultado de una ronda se muestra y se descarta
- Grabación de la voz a archivo (la entonación solo ESCUCHA en vivo: los
  bloques del micrófono se analizan y se descartan)

Esas secciones existen como **placeholders vacíos** en la navegación, solo para que la
arquitectura ya las contemple y no haya que reestructurar después.

## Qué SÍ construimos ahora: la Librería

Una pantalla de exploración libre con 4 tipos de contenido:

1. Escala mayor
2. Escala menor (natural, armónica y melódica — las 3 variantes)
3. Arpegio mayor
4. Arpegio menor

Reglas de negocio clave:

- **Ninguna escala/arpegio está atada a una nota fija.** El usuario elige la nota base
  (de las 12 notas) y el contenido se recalcula dinámicamente.
- Cada nota se representa como un **botón**. Al presionarlo, suena esa nota específica
  con timbre de **piano** (muestras reales, no síntesis) por defecto — más adelante habrá
  un ajuste en Configuraciones para cambiar el timbre, pero eso NO es parte de este MVP.
- Fórmulas de grados en semitonos desde la tónica:
  - Mayor: `[0,2,4,5,7,9,11]`
  - Menor natural: `[0,2,3,5,7,8,10]`
  - Menor armónica: `[0,2,3,5,7,8,11]`
  - Menor melódica (ascendente): `[0,2,3,5,7,9,11]`
  - Arpegio mayor: `[0,4,7,12]`
  - Arpegio menor: `[0,3,7,12]`

## Qué SÍ construimos ahora: los Ejercicios

Entrenamiento auditivo por rondas de 10 ejercicios. Dos tipos, que se pueden practicar
sueltos o mezclados ("Mixto"):

1. **Identificación de intervalo**: suenan la nota base (visible) y otra nota oculta; hay
   que decir qué intervalo forman eligiendo entre opciones que son INTERVALOS
   ("5ª justa", "3ª menor"), nunca notas.
2. **Identificación de nota**: suena la nota base y hay que encontrar cuál de tres
   candidatas está al intervalo pedido. Las opciones NO muestran su nota: son sonido, y
   pulsarlas las hace sonar tantas veces como haga falta.

Reglas de negocio clave:

- La dificultad se elige antes de empezar: **7 niveles acumulativos** (cada uno añade
  intervalos a los del anterior), del 8ª/5ª justas al tritono. Viven en
  `domain/ear-training/levels.ts`; el color de cada franja lo decide `tier`, no la UI.
- La nota base sale de las 12 tónicas y siempre en la octava 4, para que la nota más
  aguda posible (base + 8ª) caiga dentro del banco de muestras C4–C6.
- Corregir es un paso explícito: "Confirmar" solo se habilita con una opción elegida y,
  tras corregir, el MISMO botón pasa a decir "Continuar".
- Al terminar la ronda se REEMPLAZA la pantalla del ejercicio por la de
  resultados (`exercise/summary`): aciertos, tiempo medio y repeticiones medias por
  pregunta (cuántas veces hubo que volver a oír una nota YA escuchada),
  intervalos fallados y el acierto más rápido, todo calculado en
  `domain/ear-training/roundSummary.ts`, no en la pantalla. Ahí el "atrás" del
  sistema equivale a "Continuar"; en la ronda, en cambio, salir (flecha o
  "atrás") pide confirmación con un `ConfirmDialog`. En la raíz de las pestañas
  el "atrás" del sistema también confirma antes de cerrar la app
  (`shared/navigation/ExitConfirmation`).

## Qué SÍ construimos ahora: los Ejercicios de entonación

Se escucha una referencia y se CANTA la respuesta; el micrófono detecta la
altura cantada. Dos tipos, sin modo Mixto:

1. **Entonación de intervalos**: suena la nota base y hay que cantar el
   intervalo pedido, **solo ascendente**. Usa los mismos 7 niveles de
   `levels.ts`.
2. **Entonación de notas**: una SOLA tecla hace sonar a la vez 1, 2, 3 o 4
   notas y hay que cantar la de la función pedida (fundamental, 3ª, 5ª, 7ª).
   Tiene 5 niveles propios (`domain/singing/chordLevels.ts`): una nota →
   díada → tríada en estado fundamental → tríadas invertidas → cuatríadas.
   Las inversiones tienen nivel propio porque en estado fundamental la función
   coincide con la posición y se puede acertar sin oírla.

Reglas de negocio clave:

- Se califica **sin importar la octava** (una voz grave canta una octava abajo
  del piano C4–C6). Consecuencia aceptada: la 8ª justa se acierta repitiendo la
  base.
- ±10 cents = perfecto (hoja morada); ±25 = afinado (verde); ±50 = "casi"
  (hoja ámbar, cuenta como fallo); más = otra nota (roja), y la corrección dice
  QUÉ se cantó. Sobre la hoja, una barra de -50 a +50 cents centrada en la nota
  pedida (`domain/singing/tuningGauge.ts`). Todo en `domain/singing/`.
- La tecla del acorde lleva su cifrado con bajo (`C/E`; díadas `C–E`,
  `domain/singing/chordSymbol.ts`). Al corregir se cambia por un teclado
  dibujado en la app (`ChordKeyboard`, geometría en
  `domain/music-theory/keyboard.ts`): solo suenan las teclas del acorde, la
  pedida va señalada con una flecha y otra tecla hace sonar el acorde entero.
- La nota objetivo NO se puede escuchar antes de cantar; aparece al corregir.
- Sin "Confirmar": la toma se cierra sola al callar (`domain/pitch/singingTake.ts`)
  y se califica; solo hay "Continuar". La detección de altura es YIN en TS puro
  (`domain/pitch/pitchDetection.ts`).
- El micrófono es `MicButton` (`shared/design-system/`), copia del de Duolingo:
  cuadrado azul → píldora con puntos → barras con el volumen → gris hundido.

## Arquitectura — REGLA DE ORO

`domain/` es TypeScript puro. **Nunca** debe importar nada de `react-native`, `expo`,
ni de componentes de UI. Es la lógica musical (notas, fórmulas de escalas, construcción de
escalas) y debe ser 100% testeable con Jest sin emulador ni dispositivo.

```
src/
  domain/
    music-theory/       # note.ts, scale-formulas.ts, scale-builder.ts, keyboard.ts (puro TS)
    ear-training/       # intervals.ts, levels.ts, exerciseGenerator.ts, roundSummary.ts (puro TS)
    pitch/              # pitchDetection.ts (YIN), singingTake.ts (cuándo termina una toma)
    singing/            # chords.ts, chordLevels.ts, chordSymbol.ts, singingGenerator.ts,
                        #   singingEvaluation.ts, singingSummary.ts, tuningGauge.ts
    audio/               # IAudioPlayer.ts, IMicrophone.ts (interfaces, sin implementación)
  infrastructure/
    audio/               # PianoSamplerPlayer.ts (motor real) + pianoPlayer.ts (instancia única)
                         #   + microphone.ts (nativo) / microphone.web.ts (getUserMedia)
  features/
    library/
      components/        # RootNotePicker, ScaleFamilySelector, ScaleSubtypeSelector, ScaleDegreeButtons
      screens/
      hooks/              # useScalePlayer
    exercises/
      components/        # AnswerOption, NoteKey, IntervalExercise, NoteExercise,
                         #   AnswerFeedbackSheet, ExerciseProgressBar, RoundSummaryView,
                         #   SingingExerciseView, ChordKeyboard, TuningGauge,
                         #   SingingSummaryView, SummaryParts…
      screens/           # ExercisesScreen (menú), LevelSelectScreen, ExerciseRoundScreen,
                         #   RoundSummaryScreen, SingingRoundScreen, SingingSummaryScreen
      hooks/              # useExerciseRound, useNotePlayer, useNoteFormatter,
                         #   useSingingRound, useSingingTake
    home/                 # placeholder, NO implementar lógica todavía
    profile/              # placeholder, NO implementar lógica todavía
  shared/
    design-system/        # componentes base reutilizables (incl. ConfirmDialog, MicButton)
    navigation/           # useHardwareBack + ExitConfirmation (atrás del sistema)
    theme/
  app/                    # rutas de Expo Router (reemplaza navigation/)
    _layout.tsx            # layout raíz
    (tabs)/
      _layout.tsx          # bottom tabs: Librería (inicial), Ejercicios, Configuración
      index.tsx            # → LibraryScreen (wrapper fino)
      exercises.tsx        # → ExercisesScreen (menú de ejercicios)
      settings.tsx         # → SettingsScreen
      home.tsx             # → HomeScreen placeholder
      profile.tsx          # → ProfileScreen placeholder
    exercise/              # fuera de las tabs: una ronda no se abandona por accidente
      levels.tsx           # → LevelSelectScreen (?mode=, incluye singInterval/singNote)
      round.tsx            # → ExerciseRoundScreen (?mode=&level=)
      summary.tsx          # → RoundSummaryScreen (?mode=&summary=)
      sing.tsx             # → SingingRoundScreen (?kind=&level=)
      sing-summary.tsx     # → SingingSummaryScreen (?kind=&summary=)
```

Los archivos de `src/app/` son wrappers finos: la UI real vive en `features/*/screens/`.
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
