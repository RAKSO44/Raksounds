# domain/music-theory/

Teoría musical en TypeScript puro. El modelo separa dos conceptos:

- **Altura (pitch)**: qué frecuencia suena. Canónico: número MIDI (C4 = 60).
  Es lo que consume el reproductor de audio.
- **Deletreo (spelling)**: cómo se escribe la nota — letra (A–G) + alteración
  (♭♭…♯♯). E♭ y D♯ son la misma altura pero distinto deletreo, y en una escala
  importa: E♭ mayor se escribe E♭ F G A♭ B♭ C D (cada letra una vez).

Archivos:

- `note.ts` — `NoteName` (deletreo), `Note` (deletreo + octava), conversiones
  a/desde MIDI, transposición, formateo (`E♭4`) y las 12 tónicas de la UI
  (`CHROMATIC_ROOTS`).
- `scaleFormulas.ts` — fórmulas en semitonos (mayor, menor natural/armónica/
  melódica, arpegios) + pasos de letra para deletrear cada grado.
- `scaleBuilder.ts` — `buildScale(tónica, octava, tipo)` → grados con deletreo
  diatónico correcto y su MIDI. El deletreo se deriva algorítmicamente, sin
  tablas por tonalidad.

Nada aquí conoce React, Expo ni audio real.
