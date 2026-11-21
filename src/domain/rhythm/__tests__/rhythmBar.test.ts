import { FigureId } from '../figures';
import {
  emptyBar,
  figureAt,
  figureSpans,
  fits,
  insertFigure,
  insertionIndex,
  isFull,
  moveFigure,
  remainingUnits,
  removeFigure,
  RhythmBar,
  swapFigures,
  usedUnits,
} from '../rhythmBar';

/** Una barra de una redonda llena con estas figuras, en orden. */
function barOf(...figures: FigureId[]): RhythmBar {
  return figures.reduce<RhythmBar>((bar, figure) => {
    const next = insertFigure(bar, figure, bar.figures.length);
    if (next === null) throw new Error(`no cabe ${figure}`);
    return next;
  }, emptyBar(16));
}

const ids = (bar: RhythmBar) => bar.figures.map((placed) => placed.figure);

describe('barra rítmica', () => {
  it('se llena de muchas formas distintas hasta su duración', () => {
    expect(isFull(barOf('whole'))).toBe(true);
    expect(isFull(barOf('half', 'quarter', 'eighth', 'sixteenth', 'sixteenth'))).toBe(true);
    const sixteenths: FigureId[] = Array.from({ length: 16 }, () => 'sixteenth');
    expect(isFull(barOf(...sixteenths))).toBe(true);
  });

  it('no deja sobrepasar la duración', () => {
    const bar = barOf('half', 'quarter');
    expect(remainingUnits(bar)).toBe(4);
    expect(fits(bar, 'quarter')).toBe(true);
    expect(fits(bar, 'half')).toBe(false);
    expect(insertFigure(bar, 'half', 0)).toBeNull();
    expect(insertFigure(barOf('whole'), 'sixteenth', 1)).toBeNull();
  });

  it('las figuras se repiten sin límite mientras quepan, cada una con su clave', () => {
    const bar = barOf('quarter', 'quarter', 'quarter');
    expect(new Set(bar.figures.map((placed) => placed.key)).size).toBe(3);
    expect(usedUnits(bar)).toBe(12);
  });

  it('inserta donde se suelta y corre a las de detrás', () => {
    const bar = barOf('half', 'eighth');
    const inserted = insertFigure(bar, 'quarter', 1);
    expect(inserted && ids(inserted)).toEqual(['half', 'quarter', 'eighth']);
    expect(inserted && figureSpans(inserted).map((span) => span.start)).toEqual([0, 8, 12]);
  });

  it('quitar una figura deja su espacio libre y junta a las demás', () => {
    const bar = barOf('half', 'quarter', 'quarter');
    const removed = removeFigure(bar, bar.figures[1].key);
    expect(ids(removed)).toEqual(['half', 'quarter']);
    expect(remainingUnits(removed)).toBe(4);
  });

  it('intercambia dos figuras aunque duren distinto', () => {
    const bar = barOf('half', 'quarter', 'eighth');
    const swapped = swapFigures(bar, bar.figures[0].key, bar.figures[2].key);
    expect(ids(swapped)).toEqual(['eighth', 'quarter', 'half']);
    expect(usedUnits(swapped)).toBe(usedUnits(bar));
    expect(swapFigures(bar, bar.figures[0].key, bar.figures[0].key)).toBe(bar);
  });

  it('mueve una figura colocada a otra posición', () => {
    const bar = barOf('half', 'quarter', 'eighth');
    expect(ids(moveFigure(bar, bar.figures[0].key, 2))).toEqual(['quarter', 'eighth', 'half']);
    expect(ids(moveFigure(bar, 999, 0))).toEqual(ids(bar));
  });

  it('sabe qué figura hay en cada punto y dónde entra algo soltado', () => {
    const bar = barOf('half', 'quarter');
    expect(figureAt(bar, 3)?.figure).toBe('half');
    expect(figureAt(bar, 9)?.figure).toBe('quarter');
    expect(figureAt(bar, 13)).toBeNull();

    expect(insertionIndex(bar, 1)).toBe(0);
    expect(insertionIndex(bar, 5)).toBe(1);
    expect(insertionIndex(bar, 11)).toBe(2);
    expect(insertionIndex(bar, 15)).toBe(2);
  });
});
