# Créditos de audio — banco cromático

Muestras de piano en uso: **FluidR3_GM** (`acoustic_grand_piano`), soundfont
creado por Frank Wen. Licencia **CC BY 3.0** —
<https://creativecommons.org/licenses/by/3.0/us/>

- Fuente de los mp3 pre-renderizados: <https://github.com/gleitz/midi-js-soundfonts>
  (prefijo `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/`)
- Subconjunto incluido: **cromático C4–C6** (MIDI 60–84), un archivo por
  semitono, 25 muestras.

Los nombres se renombraron de bemoles (`Db4`) a sostenidos (`Cs4`) para seguir la
convención del proyecto.

## Por qué un banco cromático

El banco anterior (Salamander) estaba muestreado cada 3 semitonos y las notas
intermedias se afinaban con `setPlaybackRate`. En Android ese rate no se aplica
desde la muestra 0 (ExoPlayer lo propaga de forma asíncrona), así que las notas
intermedias arrancaban desafinadas y se corregían a mitad del ataque. Con una
grabación por semitono el rate es siempre 1 y el problema no puede ocurrir.

La atribución debe mantenerse en la app publicada (pantalla de créditos o ficha
de la tienda).
