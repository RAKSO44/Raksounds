# Créditos

Este archivo es la **única** fuente de créditos del proyecto: no debe haber
`CREDITS.md` sueltos en `assets/` ni en ninguna otra carpeta. La pantalla de
Créditos de la app (`src/features/credits/`) muestra esta misma información.

## Creación de la app

Oscar Alonso Cruzalegui Castillo
oscarcruzaleguicastillo@gmail.com

## Colaborador clave

Claude Code

(Solo aquí, en docs: no se muestra en la pantalla de Créditos de la app.)

## Mensaje del autor

El texto que la app muestra en Créditos vive en
[`author-message.md`](./author-message.md).

---

## Sonidos y música

### Muestras de piano — Salamander Grand Piano

Grabado por **Alexander Holm** (Yamaha C5).
Licencia **CC BY 3.0** — <https://creativecommons.org/licenses/by/3.0/>

- Fuente original: <https://sfzinstruments.github.io/pianos/salamander/>
- Archivos mp3 (muestreo en terceras menores, C2–C7, una capa de velocidad)
  obtenidos de la distribución del proyecto Tone.js:
  <https://tonejs.github.io/audio/salamander/>
- Originales sin modificar: `assets/audio/piano/`
- Banco que consume la app: `assets/audio/piano-chromatic/`

La atribución debe mantenerse en la app publicada (pantalla de Créditos o ficha
de la tienda), **indicando que las muestras fueron modificadas**.

### Qué se hizo con ellas (obra derivada)

Los archivos de `assets/audio/piano-chromatic/` **no son los originales**: se
generan con `scripts/build-piano-samples.mjs` a partir de los de
`assets/audio/piano/`.

1. **Completar la cromática.** El banco original trae una muestra cada 3
   semitonos (C, D♯, F♯, A). Cada semitono faltante se resamplea desde su
   muestra más cercana, como máximo **±1 semitono** — práctica estándar de un
   sampler, a esa distancia el timbre no se deforma de forma audible.
2. **+7 dB de ganancia**, igual para todos los archivos. Los originales pican
   entre −8 y −12 dBFS y en un móvil se oían muy bajos. La ganancia es única a
   propósito: normalizar archivo por archivo aplanaría la curva natural del
   piano, donde los agudos suenan menos que los graves.
3. **Recorte a 8 s** con fundido final de 1 s. Solo una nota mantenida llega
   tan lejos (a esa altura ya casi se apagó), y los originales duraban entre
   6 y 16 s.

Resultado: **cromático C4–C6** (MIDI 60–84), 25 archivos, uno por semitono.

### Por qué offline y no transponiendo en el dispositivo

Afinar en caliente con `setPlaybackRate` (expo-audio) no se aplica desde la
muestra 0: ExoPlayer propaga el rate de forma asíncrona en su hilo de
reproducción, así que las notas intermedias arrancaban con la altura de la
muestra cruda y "se corregían solas" a mitad del ataque. Haciendo el resampleo
antes de compilar, el motor reproduce siempre a rate 1 y ese fallo no puede
ocurrir.
