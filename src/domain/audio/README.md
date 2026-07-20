# domain/audio/

Contrato de reproducción de audio (`IAudioPlayer.ts`): interfaz que el dominio y las
features consumen sin conocer la implementación real.

La implementación concreta (motor de muestras + piano Salamander) vive en
`src/infrastructure/audio/`. Aquí solo hay tipos e interfaces.

El contrato es **note on / note off**, no "reproduce un sonido": una tecla suena
mientras el dedo la mantiene. `noteOn` devuelve un identificador de voz y
`noteOff` recibe ESE identificador, no la altura MIDI, para que dos pulsaciones
de la misma nota puedan solaparse y soltarse por separado.
