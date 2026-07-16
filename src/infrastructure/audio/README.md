# infrastructure/audio/

Implementación real del contrato `IAudioPlayer` (definido en `src/domain/audio/`):

- `ExpoAudioPlayer.ts` — reproducción con **expo-audio** y muestras reales de piano
  multi-sampleadas (banco tipo Salamander Grand Piano).

Esta es la única capa que conoce expo-audio. Si cambiamos de motor de audio,
solo se toca esta carpeta.
