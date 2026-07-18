# Raksound — Contexto del proyecto

## Qué es Raksound

App móvil (Android primero, con visión multiplataforma) para que estudiantes de **canto**
practiquen escalas musicales y entrenen el oído. NO es una app para leer partitura ni para
aprender un instrumento: el objetivo es que el usuario aprenda la **sonoridad** de escalas
y arpegios, y pueda reproducirlos con su propia voz de forma precisa.

## Alcance ACTUAL (MVP) — léelo con atención

Estamos construyendo **únicamente la sección "Librería"**. NO implementes todavía:

- Autenticación ni base de datos (llegará después, probablemente con Supabase)
- La sección "Home" (roadmap gamificado estilo Duolingo)
- La sección "Perfil" (logros, diamantes, desbloqueables)
- Ejercicios de entrenamiento auditivo (identificar intervalos, etc.)
- Grabación o detección de pitch de la voz del usuario

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

## Arquitectura — REGLA DE ORO

`domain/` es TypeScript puro. **Nunca** debe importar nada de `react-native`, `expo`,
ni de componentes de UI. Es la lógica musical (notas, fórmulas de escalas, construcción de
escalas) y debe ser 100% testeable con Jest sin emulador ni dispositivo.

```
src/
  domain/
    music-theory/       # note.ts, scale-formulas.ts, scale-builder.ts (puro TS)
    audio/               # IAudioPlayer.ts (interfaz, sin implementación)
  infrastructure/
    audio/               # ExpoAudioPlayer.ts (implementación real con expo-audio)
  features/
    library/
      components/        # RootNotePicker, ScaleFamilySelector, ScaleSubtypeSelector, ScaleDegreeButtons
      screens/
      hooks/              # useScalePlayer
    home/                 # placeholder, NO implementar lógica todavía
    profile/              # placeholder, NO implementar lógica todavía
  shared/
    design-system/        # componentes base reutilizables
    theme/
  app/                    # rutas de Expo Router (reemplaza navigation/)
    _layout.tsx            # layout raíz
    (tabs)/
      _layout.tsx          # bottom tabs: Librería (inicial), Home, Perfil
      index.tsx            # → LibraryScreen (wrapper fino)
      home.tsx             # → HomeScreen placeholder
      profile.tsx          # → ProfileScreen placeholder
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
- **expo-audio** para reproducción de sonido (`expo-av` fue eliminado en SDK 55)
- Muestras de piano multi-sampleadas (ej. banco tipo Salamander Grand Piano, de uso libre)
- Zustand para estado global (liviano, suficiente para el alcance actual; instalar cuando se use)
- **Sin framework de estilos** (ni NativeWind ni similares): componentes 100% propios con
  `StyleSheet` y tokens en `shared/theme/`
- **Estética Duolingo + modo oscuro** obligatorios: la referencia visual es siempre
  Duolingo (nunca UI genérica), con morado de marca y azul secundario, y tema
  claro/oscuro según el sistema. Detalle y componentes reutilizables en
  `.claude/rules/design-system.md`
- Jest + React Native Testing Library (v14: `render` es **async**, siempre `await render(...)`)

## Estilo de código

- Componentes funcionales, hooks, sin clases
- Nombres de archivos: `PascalCase.tsx` para componentes, `camelCase.ts` para lógica
- Preferir funciones puras en `domain/`, sin efectos secundarios
- Comentarios solo donde la lógica musical no sea obvia (ej. por qué un semitono específico)
