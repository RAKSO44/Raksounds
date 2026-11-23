# infrastructure/audio/

Implementación real del contrato `IAudioPlayer` (definido en `src/domain/audio/`):

- `PianoSamplerPlayer.ts` — motor de muestras sobre **react-native-audio-api**
  (Web Audio API nativa). Cada pulsación crea un `AudioBufferSourceNode` nuevo,
  así que la polifonía es ilimitada y no hay estado que rebobinar entre notas.
- `pianoSampleMap.ts` — banco **cromático** C4–C6, un archivo FLAC por
  semitono. Cada archivo empieza en su ataque (el aire inicial se recorta al
  generarlo), así que una nota programada en un instante SUENA en ese
  instante. Es FLAC y no MP3 porque un MP3 siempre trae 25–50 ms de silencio
  de códec al principio, que retrasaba cada nota respecto del metrónomo.
- `SoundEffectsPlayer.ts` — efectos de los ejercicios (`assets/audio/effects/`),
  con su propio contexto para no pasar por el limitador del piano, pero con la
  misma ganancia de bus (`MASTER_GAIN`). Los archivos están nivelados a la
  sonoridad media de las notas (≈ -18 LUFS) con
  `scripts/level-sound-effects.mjs`: si se cambia o añade un efecto, se vuelve
  a correr ese script en vez de tocar ganancias en el código.
- `MetronomePlayer.ts` — golpes del metrónomo de las lecciones del Home. El
  "toc" se sintetiza una vez al cargar y cada golpe se programa con
  `start(when)` en el reloj del contexto: un `setTimeout` por golpe tiembla y
  no serviría para calificar un toque. `play` devuelve el instante del primer
  golpe en los dos relojes: el de `performance.now()` (con el que se miden
  los toques) y el de audio (sobre el que se programan las notas).
- `audioEngine.ts` — el `AudioContext` que **comparten el piano y el
  metrónomo**, y su reloj (`audioClock`). Lo que deba sonar junto (una figura
  sobre su pulso) se programa en este reloj, nunca convirtiendo desde
  `performance.now()`: con un contexto cada uno, la figura y el golpe se
  desalineaban de oído (dos flujos de salida, dos relojes que derivan). Los
  motores reciben el contexto por parámetro (`createPianoSamplerPlayer(
  sharedAudioContext)`), y en los tests, uno simulado.

Esta es la única capa que conoce react-native-audio-api. Si cambiamos de motor,
solo se toca esta carpeta.

## Por qué un motor de muestras y no un reproductor de medios

La versión anterior usaba `expo-audio` con un pool de players reciclados vía
`pause()` + `seekTo(0)`. Un reproductor de medios sirve para una pista larga, no
para disparar muestras, y de ahí salían tres bugs: notas que no sonaban, notas que
sonaban "empezadas" (sin ataque) y polifonía limitada a 2 voces por nota. Los tres
venían del mismo sitio —reutilizar un player obliga a rebobinarlo, y rebobinar es
asíncrono—, así que se resolvieron cambiando el modelo, no parcheando la carrera.

## Envolvente

- Ataque: ninguno en código. Cada archivo ya empieza con un fundido de 2 ms
  justo antes del martillo, así que no hay click ni hace falta una rampa (que
  solo apagaría el golpe).
- Toque instantáneo: la nota dura 1.5 s en total.
- Nota mantenida: suena mientras el dedo siga puesto (hasta 8 s, el largo
  de cada muestra del banco).
- Al soltar: 0.7 s de caída gradual, nunca un corte seco.

Los dos últimos casos son la misma fórmula (`max(ahora, inicio + 0.8 s)` como
punto de release), no ramas distintas.

## Regenerar el banco

Las muestras cromáticas se derivan de `assets/audio/piano/` (originales
Salamander, CC BY). Para regenerarlas:

```bash
npm install --no-save ffmpeg-static
node scripts/build-piano-samples.mjs
```
