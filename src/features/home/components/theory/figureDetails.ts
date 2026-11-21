import { FigureId } from '@/domain/rhythm';

import { Segment } from './RichText';

/**
 * Lo que dice el recuadro de detalle de la tabla de figuras al elegir una:
 * corto. Se va de la que más dura a la que menos, así que cada figura se
 * compara SOLO con la anterior ("dura la mitad de…"), nunca "el doble de".
 */
export const FIGURE_DETAILS: Record<FigureId, readonly (readonly Segment[])[]> = {
  whole: [
    ['Es la figura que más dura de las cinco.'],
    ['No tiene plica (el palito): solo una cabeza hueca.'],
  ],
  half: [
    ['Dura la mitad de ', { figure: 'whole' }, '.'],
    ['Es hueca, como la redonda, pero ya tiene plica.'],
  ],
  quarter: [
    ['Dura la mitad de ', { figure: 'half' }, '.'],
    ['¡Es la figura que más vas a encontrar en las canciones!'],
  ],
  eighth: [
    ['Dura la mitad de ', { figure: 'quarter' }, '.'],
    [
      'A veces, cuando se escriben corcheas juntas, las unen así: ',
      { beamed: 'eighth', count: 2 },
      '. Tranquilo, es lo mismo que escribir ',
      { figure: 'eighth' },
      { figure: 'eighth' },
      '.',
    ],
  ],
  sixteenth: [
    ['Dura la mitad de ', { figure: 'eighth' }, '.'],
    [
      'Juntas se unen con dos barras: ',
      { beamed: 'sixteenth', count: 2 },
      ', que es lo mismo que escribir ',
      { figure: 'sixteenth' },
      { figure: 'sixteenth' },
      '.',
    ],
  ],
};
