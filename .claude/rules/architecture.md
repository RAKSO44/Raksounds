# Arquitectura — regla de dependencias

Las capas solo pueden importar en esta dirección (de arriba hacia abajo):

```
app/            → wrappers finos de Expo Router. Solo importan de features/.
features/       → pantallas, componentes y hooks de cada feature.
                  Importan de domain/, shared/ y (solo en hooks de
                  composición, ej. useScalePlayer) de infrastructure/.
infrastructure/ → implementaciones concretas (react-native-audio-api, etc.).
                  Solo importan interfaces/tipos de domain/.
shared/         → design-system y theme. No importan de ninguna otra capa.
domain/         → TypeScript puro. NO importa NADA: ni react, ni react-native,
                  ni expo, ni de otras capas. 100% testeable con Jest solo.
```

Reglas concretas:

- Si aparece un import de `react`, `react-native` o `expo*` dentro de
  `src/domain/`, es un error de arquitectura: detente y avísame.
- Los componentes de UI dependen de la **interfaz** (`IAudioPlayer`), nunca de
  la implementación (`ExpoAudioPlayer`). La implementación se inyecta en un
  único punto de composición (hook o provider).
- Los archivos de `src/app/` son wrappers finos: importan una screen de
  `features/*/screens/` y la devuelven. Cero lógica, cero estilos ahí.
- Una feature no importa de otra feature. Lo compartido entre features vive en
  `shared/` (UI) o `domain/` (lógica).
- `home/` y `profile/` son placeholders: no implementar lógica ahí hasta que
  el alcance del MVP lo indique.
- Cada módulo expone su API pública vía `index.ts` (barrel); desde fuera del
  módulo se importa del barrel, no de archivos internos.

## Soporte web (react-native-web)

Raksound corre en iOS, Android **y** web desde el mismo árbol de código. La
decisión de arquitectura (2026-08) fue explícita: **NO** carpetas paralelas
`android/`, `ios/`, `web/` con lógica duplicada. Esas carpetas ya existen pero
son las que genera `expo prebuild` (nativo, gitignoradas) — no se crea una
tercera a mano para web. En vez de eso, cada plataforma comparte el 100% del
árbol y solo diverge donde una capa toca una API que no existe en la otra,
usando la resolución de extensión de plataforma de Metro: un archivo
`nombre.web.ts`/`.web.tsx` junto al original (`nombre.ts`) se usa
automáticamente al compilar para web, sin tocar los imports que lo consumen.

Reglas concretas:

- **Solo `infrastructure/` y `shared/`** pueden tener archivos `.web.ts` /
  `.web.tsx`. `domain/` (TS puro) y `features/` (composición de UI) deben ser
  el mismo código en las tres plataformas — si una pantalla necesita ramificar
  por plataforma, es señal de que la lógica que cambia pertenece más abajo
  (un hook de `infrastructure/` o un componente de `shared/`), no de que la
  pantalla deba forkearse.
- **Diferencias de layout por ANCHO de pantalla no son diferencias de
  plataforma.** Web abierta en un celular debe verse igual que la app nativa;
  el layout de escritorio se decide por breakpoint (`useWindowDimensions` +
  tokens de `shared/theme`) dentro del mismo componente, nunca con un archivo
  `.web.tsx` — un archivo `.web.tsx` implicaría que TODO acceso web (incluido
  desde el celular) se ve distinto, que es exactamente lo que no queremos.
- Módulos que ya son multiplataforma sin shim (no tocar):
  - `domain/` — TypeScript puro, corre igual en las tres plataformas.
  - `react-native-gesture-handler` y `react-native-reanimated` — tienen
    implementación web (Reanimated cae a JS puro en vez de worklets nativos).
  - `react-native-audio-api` — tiene dos motores bajo la misma interfaz:
    nativo (JSI) y web (delega al Web Audio API real del navegador). Por eso
    `PianoSamplerPlayer.ts` (que ya está escrito 100% contra Web Audio API) no
    necesita una variante web: es la misma capa en las tres plataformas.
  - `expo-haptics` — ya no-opea en web vía el propio `Platform.OS === 'web'`
    de `shared/haptics/haptics.ts`; no hace falta un shim aparte.
- Módulos que SÍ necesitan shim porque son nativos puros (JSI) sin build web:
  - `react-native-mmkv` → `shared/settings/mmkvStorage.ts` (nativo) +
    `shared/settings/mmkvStorage.web.ts` (web, respaldado por `localStorage`).
    Mismo patrón a seguir si en el futuro se agrega otro módulo nativo sin
    soporte web (p. ej. algo de sistema de archivos): shim colocado junto al
    original, misma forma de interfaz, sin duplicar el resto del módulo.
- Jest corre sobre la plataforma nativa por defecto (preset `jest-expo`), así
  que los archivos `.web.ts` no se ejercitan en la suite actual. Si un shim
  web deja de ser trivial (más allá de reimplementar la misma interfaz),
  agregarle test propio en vez de asumir que "como pasa en nativo, pasa en
  web".

### Layout responsive (breakpoint, no plataforma)

- `shared/theme/tokens.ts` define `breakpoints.wide` (900px) y
  `navigation.railWidth` (88px). `useIsWideScreen()` (`shared/theme/`) es la
  ÚNICA fuente de verdad sobre si el layout es "angosto" o "ancho" — se basa
  en `useWindowDimensions`, no en `Platform.OS`.
- La navegación (`DuolingoTabBar`) usa esa señal para decidir su propia forma
  (tab bar inferior vs. riel lateral), y `(tabs)/_layout.tsx` la usa para fijar
  `screenOptions.tabBarPosition` (`'bottom' | 'left'`) en el `<Tabs>` de
  Expo Router. Ese `tabBarPosition` es una opción NATIVA de
  `@react-navigation/bottom-tabs` v7 (vendorizada dentro de `expo-router`):
  cuando es `'left'`/`'right'`, `BottomTabView` cambia su contenedor raíz a
  `flexDirection: 'row'` y el contenido de la pantalla activa (`flex: 1`)
  automáticamente ocupa el resto del ancho. Por eso no hizo falta ningún
  `marginLeft`/posicionamiento absoluto a mano: es el mecanismo que la propia
  librería expone para este patrón ("adaptive navigation" estilo Material 3),
  y es compatible con un `tabBar` custom como `DuolingoTabBar`.
- Si se agrega una segunda pantalla que necesite reflow propio en ancho
  (grillas, columnas), sigue el mismo patrón: leer `useIsWideScreen()` y
  ramificar el layout dentro del propio componente — nunca un archivo
  `.web.tsx`, porque la condición es el ancho, no la plataforma.

### Config y deploy

- `app.config.ts` reemplaza a `app.json` (antes estático). Motivo: el
  `experiments.baseUrl` que necesita el export de GitHub Pages
  (`/Raksounds`, porque el sitio vive en `usuario.github.io/Raksounds`) solo
  debe activarse al exportar para GitHub Pages — si quedara fijo en JSON,
  `expo start --web` serviría todo bajo `/Raksounds` y rompería el dev
  server local. La condición vive en una sola variable de entorno
  (`EXPO_PUBLIC_GH_PAGES_BUILD`) leída en `app.config.ts`.
- Scripts (`package.json`):
  - `npm run web` — dev server con hot reload (`expo start --web`).
  - `npm run export:web` — build estático a `dist/`, sin prefijo de ruta
    (para probar el export localmente, ej. `npx serve dist`).
  - `npm run deploy:web` — build con el `baseUrl` de GitHub Pages activado
    y publicación a la rama `gh-pages` (paquete `gh-pages`).
- Antes de que `deploy:web` sirva de verdad hace falta habilitar GitHub Pages
  en el repo (Settings → Pages → Deploy from a branch → `gh-pages` / root).
  Es un cambio de configuración del repositorio, no de código: no se hizo
  automáticamente.
