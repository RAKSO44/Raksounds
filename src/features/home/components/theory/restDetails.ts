import { figureById, FigureId } from '@/domain/rhythm';

import { Segment } from './RichText';

/** "Silencio de blanca". */
export const restName = (figure: FigureId) =>
  `Silencio de ${figureById(figure).name.toLowerCase()}`;

/**
 * Lo que dice el recuadro de detalle de la tabla de silencios: cuánto dura
 * (lo mismo que su figura) y un truco para reconocerlo. Los de redonda y
 * blanca son el mismo rectángulo: se distinguen por la única línea que ya
 * conocen, de la que uno cuelga y sobre la que el otro se sienta.
 */
export const REST_DETAILS: Record<FigureId, readonly (readonly Segment[])[]> = {
  whole: [
    ['Dura lo mismo que ', { figure: 'whole' }, '.'],
    [
      'Es un rectángulo que ',
      { text: 'cuelga', mark: 'highlight' },
      ' de la línea, como un murciélago 🦇.',
    ],
  ],
  half: [
    ['Dura lo mismo que ', { figure: 'half' }, '.'],
    [
      'Es el mismo rectángulo, pero ',
      { text: 'sentado', mark: 'highlight' },
      ' sobre la línea, como un sombrero 🎩.',
    ],
  ],
  quarter: [['Dura lo mismo que ', { figure: 'quarter' }, '.'], ['Es un zigzag, como un rayo ⚡.']],
  eighth: [
    ['Dura lo mismo que ', { figure: 'eighth' }, '.'],
    [
      'Tiene ',
      { text: 'una bolita', mark: 'highlight' },
      ', así como la corchea tiene un corchete.',
    ],
  ],
  sixteenth: [
    ['Dura lo mismo que ', { figure: 'sixteenth' }, '.'],
    [
      'Tiene ',
      { text: 'dos bolitas', mark: 'highlight' },
      ', así como la semicorchea tiene dos corchetes.',
    ],
  ],
};
