# Créditos de audio — banco cromático

Muestras de piano: **Salamander Grand Piano** (Yamaha C5), grabado por
Alexander Holm. Licencia **CC BY 3.0** — <https://creativecommons.org/licenses/by/3.0/>

- Fuente original: <https://sfzinstruments.github.io/pianos/salamander/>
- Archivos mp3 (muestreo en terceras menores, C2–C7, una capa de velocidad)
  obtenidos de la distribución del proyecto Tone.js:
  <https://tonejs.github.io/audio/salamander/>
- Los originales sin modificar viven en `assets/audio/piano/`.

## Qué se hizo con ellas (obra derivada)

Los archivos de esta carpeta **no son los originales**: se generan con
`scripts/build-piano-samples.mjs` a partir de los de `assets/audio/piano/`.

1. **Completar la cromática.** El banco original trae una muestra cada 3
   semitonos (C, D♯, F♯, A). Cada semitono faltante se resamplea desde su
   muestra más cercana, como máximo **±1 semitono** — práctica estándar de un
   sampler, a esa distancia el timbre no se deforma de forma audible.
2. **+7 dB de ganancia**, igual para todos los archivos. Los originales pican
   entre −8 y −12 dBFS y en un móvil se oían muy bajos. La ganancia es única a
   propósito: normalizar archivo por archivo aplanaría la curva natural del
   piano, donde los agudos suenan menos que los graves.
3. **Recorte a 4 s** con fundido final de 0.25 s. La app nunca deja sonar una
   nota más de eso, y los originales duraban entre 6 y 16 s.

Resultado: **cromático C4–C6** (MIDI 60–84), 25 archivos, uno por semitono.

## Por qué offline y no transponiendo en el dispositivo

Afinar en caliente con `setPlaybackRate` (expo-audio) no se aplica desde la
muestra 0: ExoPlayer propaga el rate de forma asíncrona en su hilo de
reproducción, así que las notas intermedias arrancaban con la altura de la
muestra cruda y "se corregían solas" a mitad del ataque. Haciendo el resampleo
antes de compilar, el motor reproduce siempre a rate 1 y ese fallo no puede
ocurrir.

La atribución (CC BY) debe mantenerse en la app publicada (pantalla de créditos
o ficha de la tienda), indicando que las muestras fueron modificadas.
