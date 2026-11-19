# Librería

Una pantalla de exploración libre con 4 tipos de contenido:

1. Escala mayor
2. Escala menor (natural, armónica y melódica — las 3 variantes)
3. Arpegio mayor
4. Arpegio menor

Reglas de negocio clave:

- **Ninguna escala/arpegio está atada a una nota fija.** El usuario elige la nota base
  (de las 12 notas) y el contenido se recalcula dinámicamente.
- Cada nota se representa como un **botón**. Al presionarlo, suena esa nota específica
  con timbre de **piano** (muestras reales, no síntesis) por defecto — más adelante habrá
  un ajuste en Configuraciones para cambiar el timbre, pero eso NO es parte de este MVP.
- Fórmulas de grados en semitonos desde la tónica:
  - Mayor: `[0,2,4,5,7,9,11]`
  - Menor natural: `[0,2,3,5,7,8,10]`
  - Menor armónica: `[0,2,3,5,7,8,11]`
  - Menor melódica (ascendente): `[0,2,3,5,7,9,11]`
  - Arpegio mayor: `[0,4,7,12]`
  - Arpegio menor: `[0,3,7,12]`
