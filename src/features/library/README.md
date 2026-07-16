# features/library/

**La Librería — único feature activo del MVP.** Exploración libre de escalas y arpegios:

- `components/` — `RootNotePicker`, `ScaleTypeSelector`, `ScaleDegreeButtons`.
- `screens/` — pantalla principal de la Librería.
- `hooks/` — `useScalePlayer` (conecta dominio musical + reproductor de audio).

Reglas de negocio: el usuario elige nota base (12 notas) y tipo de contenido
(escala mayor, menor ×3 variantes, arpegio mayor/menor); cada grado es un botón
que suena con timbre de piano al presionarlo.
