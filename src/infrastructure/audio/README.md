# infrastructure/audio/

Implementación real del contrato `IAudioPlayer` (definido en `src/domain/audio/`):

- `PianoSamplerPlayer.ts` — motor de muestras sobre **react-native-audio-api**
  (Web Audio API nativa). Cada pulsación crea un `AudioBufferSourceNode` nuevo,
  así que la polifonía es ilimitada y no hay estado que rebobinar entre notas.
- `pianoSampleMap.ts` — banco **cromático** C4–C6, un archivo por semitono.

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

- Ataque: 4 ms, solo para evitar un click. La muestra ya trae su propio golpe.
- Toque instantáneo: la nota dura 1.5 s en total.
- Nota mantenida: suena mientras el dedo siga puesto.
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
