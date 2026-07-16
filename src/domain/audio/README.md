# domain/audio/

Contrato de reproducción de audio (`IAudioPlayer.ts`): interfaz que el dominio y las
features consumen sin conocer la implementación real.

La implementación concreta (expo-audio + muestras de piano) vive en
`src/infrastructure/audio/`. Aquí solo hay tipos e interfaces.
