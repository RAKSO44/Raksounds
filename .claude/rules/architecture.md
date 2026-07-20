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
