# domain/audio/

Contrato de reproducción de audio (`IAudioPlayer.ts`): interfaz que el dominio y las
features consumen sin conocer la implementación real.

La implementación concreta (motor de muestras + piano Salamander) vive en
`src/infrastructure/audio/`. Aquí solo hay tipos e interfaces.

El contrato es **note on / note off**, no "reproduce un sonido": una tecla suena
mientras el dedo la mantiene. `noteOn` devuelve un identificador de voz y
`noteOff` recibe ESE identificador, no la altura MIDI, para que dos pulsaciones
de la misma nota puedan solaparse y soltarse por separado.

`ISoundEffects.ts` es el contrato de los efectos de los ejercicios (acierto,
error, ronda superada / no superada): sonidos de "disparar y olvidar", sin
note off.

`IMetronome.ts` es el contrato del metrónomo de las lecciones del Home: programa
golpes por adelantado en el reloj de audio y devuelve cuándo suena el primero,
que es la referencia para calificar los toques del usuario.
