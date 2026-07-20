# infrastructure/audio/

Implementación real del contrato `IAudioPlayer` (definido en `src/domain/audio/`):

- `ExpoAudioPlayer.ts` — reproducción con **expo-audio** y muestras reales de piano.
- `pianoSampleMap.ts` — banco **cromático**: una grabación real por semitono
  (C4–C6). Al no transponer, nunca se llama a `setPlaybackRate`, que en Android
  no se aplica desde el inicio de la muestra y desafinaba el ataque.

Esta es la única capa que conoce expo-audio. Si cambiamos de motor de audio,
solo se toca esta carpeta.
