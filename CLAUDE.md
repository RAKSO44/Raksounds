# Raksound — Contexto del proyecto

## Qué es Raksound

App móvil (Android primero, con visión multiplataforma) para que estudiantes de **canto**
practiquen escalas musicales y entrenen el oído. NO es una app para leer partitura ni para
aprender un instrumento: el objetivo es que el usuario aprenda la **sonoridad** de escalas
y arpegios, y pueda reproducirlos con su propia voz de forma precisa.

## Alcance ACTUAL (MVP) — léelo con atención

Hay cuatro secciones construidas: **Home** ("Inicio": ruta de aprendizaje,
con lección solo en los Módulos 1 y 2), **Librería**, **Ejercicios**
(auditivos y de entonación) y **Configuración** (ya no es pestaña: se abre
desde el engranaje de la cabecera del Home, ruta `/settings`).
NO implementes todavía:

- Autenticación ni base de datos (llegará después, probablemente con Supabase)
- Contenido de los módulos del Home más allá del 2: se trabajan de uno en uno y
  solo cuando el usuario lo pida (`.claude/rules/roadmap.md`). En la ruta ya
  aparecen los Módulos 3–14 (Etapas 1 a 3) como "Próximamente", solo con su
  título y temario
- La sección "Perfil" (logros, diamantes, desbloqueables)
- Persistencia del progreso de los Ejercicios (rachas, historial de rondas):
  hoy el resultado de una ronda se muestra y se descarta. El progreso de los
  módulos del Home SÍ se guarda, en el dispositivo (MMKV)
- Grabación de la voz a archivo (la entonación solo ESCUCHA en vivo: los
  bloques del micrófono se analizan y se descartan)

Perfil existe como **placeholder** ("Próximamente") con su pestaña en el tab
bar, solo para que la arquitectura ya lo contemple.

## Qué SÍ construimos ahora: el Home (ruta de aprendizaje)

Etapa 1 del roadmap, solo **Módulo 1 (Las notas musicales)** y **Módulo 2
(Pulso y tempo)**. Documento de partida y decisiones en `docs/roadmap/etapa-1/`
(las decisiones de `modulos-1-2.md` prevalecen sobre la especificación).

- Las etapas y módulos de la ruta viven en `domain/lessons/stages.ts`. Arriba
  hay UNA sola tarjeta fija (`StageBanner`) con la etapa en curso; entre etapas,
  una línea con su título (`StageDivider`), y al llegar arriba la tarjeta cambia
  de texto y color (`useStageScroll`). Tocarla abre OTRA pantalla (ruta
  `/stages`, `StagesScreen`, con la transición normal) con la lista de etapas;
  la actual va seleccionada "transparente" (cara tenue + borde de su color,
  como un `selectable`). Elegir una vuelve atrás y el Home salta a esa etapa
  (`stageSelection.ts` hace de puente). Sin animación de expansión. La última
  etapa con la que se interactuó (elegirla en la lista o tocar uno de sus
  módulos; desplazarse no cuenta) se guarda en MMKV y la app abre en ella. Cada
  etapa tiene su color (`stageTone`: verde, azul, rosa; nunca el morado de la
  cabecera ni el dorado del progreso) en su tarjeta, nodos y botones.
- Cada módulo es un círculo con su título al lado (`ModuleRow`); al tocarlo, el
  mismo círculo se estira (ancho y alto, nunca escala) hasta una tarjeta con su
  temario y DOS botones: **Teoría** (libro) y **Ejercicios** (play). Abrir uno
  cierra el otro; tocar el temario lo devuelve a círculo.
- **NADA SE BLOQUEA**: se entra a cualquier módulo, teoría o práctica en
  cualquier orden. El progreso solo se indica: teoría leída → labio dorado;
  práctica completada (≥ 80 %: 12/15, 9/11) → cara dorada; en la tarjeta, cada botón se
  vuelve dorado. El cambio se anima al volver al Home (color + un destello
  que cruza el nodo, `useStatusTransition`), nunca a escondidas.
- Teoría: hasta 3 hojas que se pasan con ← n → (el ✓ final la marca como
  leída); nada obliga a interactuar para avanzar. Los términos destacados
  (`RichText`) y los títulos de tabla abren una definición (`TooltipHost`):
  globo sin color (superficie + borde, como Duolingo) con UNA frase corta,
  del ancho que pide esa frase y centrado bajo el término.
- Práctica: ejercicios generados de una semilla, plantilla fija por módulo
  (Módulo 1: 15; Módulo 2: 11 — no hace falta llegar a 15 ni repetir un
  tipo de ejercicio que ya salió; `practiceLength`).
  Reglas en `domain/lessons/progress.ts`; guardado en
  `features/home/progressStore.ts`. En el resultado, si hubo fallos,
  "Reintentar fallos" (botón neutro) repite SOLO esas posiciones, regeneradas; lo
  recuperado se suma al intento ("+3", 12 → 15) y cuenta para completarlo
  (`recordRetry`: no suma un intento nuevo).
- Los ejercicios son DATOS (`domain/lessons/exercise.ts`): mecánicas `choice`,
  `clip-choice` (cada opción es un sonido), `tempo-choice` (cada opción es
  un pulso sin fin), `sequence` (ordenar tocando o arrastrando,
  `domain/lessons/sequenceBoard.ts`), `pick` (marcar los sonidos que van
  juntos) y `tap` (4 toques libres sobre un pulso continuo, en golpes
  seguidos, `judgeTapsOnPulse` en `domain/lessons/tapSync.ts`). Los
  estímulos son `Clip`s; los hace sonar `useClipPlayer` (piano para notas,
  metrónomo para golpes).
- **El metrónomo de la práctica es `Metronome`** (`features/home/components/`),
  dibujado con `react-native-svg` como un objeto real pero limpio: pirámide
  de nogal con labio 3D, escala crema con una línea central tenue, brazo de
  acero que llega a un extremo con cada golpe y pesa de latón a la altura de
  su BPM (más arriba = más lento, `metronomeWeightPosition`; a media altura
  mientras el tempo es la pregunta). La placa dice solo el número o "?".
  Encendido/apagado es un fundido corto: apagado = madera atenuada; al cambiar de tempo el
  brazo sigue su vaivén sin saltos.
  Los pulsos de los ejercicios NUNCA se cortan solos: el usuario los enciende
  y apaga (`useMetronomes`, uno sonando a la vez); en "tocar con el pulso"
  arranca solo y no se apaga.
- **Toda tecla que suena en pantalla se puede pulsar junto a otras y suenan a
  la vez** (`playNote`: una nota suelta no corta nada). Toda nota visible
  suena al tocarla, salvo la que hay que adivinar hasta corregir.
- El metrónomo (`IMetronome`) programa cada golpe en el reloj de audio, nunca
  con `setTimeout`: así se puede calificar un toque contra el golpe real.

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
  `domain/ear-training/roundSummary.ts`, no en la pantalla. Al corregir suena
  un efecto de acierto/error y al aparecer el resultado uno de ronda superada
  (≥ 50 %) o no superada; el corte vive en `domain/ear-training/roundOutcome.ts`
  y es el mismo que colorea el porcentaje. Ahí el "atrás" del
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
  (hoja ámbar, suena a acierto y vale MEDIO punto: 2 "casi" en 10 dejan la
  ronda en 90 %, `singingScore`); más = otra nota (roja), y la corrección dice
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
- El permiso del micrófono se pide al ELEGIR "Entonación de intervalos/notas"
  en el menú (`useMicrophoneGate`): si se niega, `MicPermissionDialog` avisa y
  no deja entrar; volver a pulsar vuelve a pedirlo. El micrófono del ejercicio
  lo sigue pidiendo por si acaso.

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
    lessons/            # Home: stages.ts (etapas/módulos), progress.ts, exercise.ts, clip.ts,
                        #   module1Practice.ts, module2Practice.ts, tapSync.ts, tempo.ts…
    audio/               # IAudioPlayer.ts, IMicrophone.ts, ISoundEffects.ts, IMetronome.ts
                         #   (interfaces, sin implementación)
  infrastructure/
    audio/               # PianoSamplerPlayer.ts (motor real) + pianoPlayer.ts (instancia única)
                         #   + microphone.ts (nativo) / microphone.web.ts (getUserMedia)
                         #   + SoundEffectsPlayer.ts / soundEffects.ts (acierto, error, fin de ronda)
                         #   + MetronomePlayer.ts / metronome.ts (golpes del Home)
  features/
    library/
      components/        # RootNotePicker, ScaleFamilySelector, ScaleSubtypeSelector, ScaleDegreeButtons
      screens/
      hooks/              # useScalePlayer
    exercises/
      components/        # NoteKey, IntervalExercise, NoteExercise, RoundSummaryView,
                         #   SingingExerciseView, ChordKeyboard, TuningGauge,
                         #   SingingSummaryView, SummaryParts…
      screens/           # ExercisesScreen (menú), LevelSelectScreen, ExerciseRoundScreen,
                         #   RoundSummaryScreen, SingingRoundScreen, SingingSummaryScreen
      hooks/              # useExerciseRound, useNotePlayer, useNoteFormatter,
                         #   useSingingRound, useSingingTake
    home/                 # ruta de aprendizaje (Módulos 1–2)
      components/        # StagePath, ModuleNode, ModuleActionCard, NoteSteps, PulseLight…
        practice/        #   vistas por mecánica (LessonExerciseView elige)
        theory/          #   páginas de teoría (theoryPages.ts: ≤ 3 por módulo)
      screens/           # HomeScreen, TheoryScreen, PracticeScreen, PracticeResultScreen
      hooks/              # useClipPlayer, useTapRun, usePracticeSession, useLessonSounds
      progressStore.ts    # progreso persistido (MMKV)
    profile/              # placeholder, NO implementar lógica todavía
  shared/
    design-system/        # componentes base reutilizables (incl. ConfirmDialog, MicButton,
                          #   AnswerOption, AnswerFeedbackSheet, BottomActionBar,
                          #   ExerciseProgressBar — los usan Ejercicios y Home)
    navigation/           # useHardwareBack + ExitConfirmation (atrás del sistema)
    theme/
  app/                    # rutas de Expo Router (reemplaza navigation/)
    _layout.tsx            # layout raíz
    (tabs)/
      _layout.tsx          # bottom tabs: Home (inicial), Librería, Ejercicios, Perfil
      index.tsx            # → HomeScreen (ruta de aprendizaje; la app abre en `/`)
      library.tsx          # → LibraryScreen (wrapper fino)
      exercises.tsx        # → ExercisesScreen (menú de ejercicios)
      profile.tsx          # → ProfileScreen placeholder ("Próximamente")
    settings.tsx           # → SettingsScreen (desde el engranaje del Home)
    stages.tsx             # → StagesScreen (desde la tarjeta de etapa del Home)
    lesson/                # fuera de las tabs, como las rondas
      theory.tsx           # → TheoryScreen (?module=)
      practice.tsx         # → PracticeScreen (?module=)
      result.tsx           # → PracticeResultScreen (?module=&score=)
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
