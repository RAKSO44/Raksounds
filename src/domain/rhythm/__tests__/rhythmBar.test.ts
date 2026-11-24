import { FigureId } from '../figures';
import {
  barItems,
  emptyBar,
  figureSpans,
  fits,
  insertFigure,
  insertionIndex,
  isFull,
  moveFigure,
  remainingUnits,
  removeFigure,
  RhythmBar,
  stickyInsertionIndex,
  toggleDot,
  toggleTie,
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

  it('mueve una figura colocada a otra posición', () => {
    const bar = barOf('half', 'quarter', 'eighth');
    expect(ids(moveFigure(bar, bar.figures[0].key, 2))).toEqual(['quarter', 'eighth', 'half']);
    expect(ids(moveFigure(bar, 999, 0))).toEqual(ids(bar));
  });

  it('sabe dónde entra algo soltado', () => {
    const bar = barOf('half', 'quarter');
    expect(insertionIndex(bar, 1)).toBe(0);
    expect(insertionIndex(bar, 5)).toBe(1);
    expect(insertionIndex(bar, 11)).toBe(2);
    expect(insertionIndex(bar, 15)).toBe(2);
  });

  it('mientras se arrastra, no cambia de sitio hasta pasar la frontera con margen', () => {
    // Fronteras: mitad de la blanca (4) y mitad de la negra (10).
    const bar = barOf('half', 'quarter');
    expect(stickyInsertionIndex(bar, 3, null, 1)).toBe(0);
    // Justo pasada la frontera, se queda donde estaba…
    expect(stickyInsertionIndex(bar, 4.5, 0, 1)).toBe(0);
    expect(stickyInsertionIndex(bar, 3.5, 1, 1)).toBe(1);
    // …y la cruza al pasar el margen.
    expect(stickyInsertionIndex(bar, 5.5, 0, 1)).toBe(1);
    expect(stickyInsertionIndex(bar, 2.5, 1, 1)).toBe(0);
    expect(stickyInsertionIndex(bar, 10.5, 2, 1)).toBe(2);
    expect(stickyInsertionIndex(bar, 8.5, 2, 1)).toBe(1);
    // Un sitio que ya no existe en la barra se descarta.
    expect(stickyInsertionIndex(bar, 1, 5, 1)).toBe(0);
  });
});

describe('barra rítmica con silencios, puntillo y ligadura (Módulo 4)', () => {
  it('un silencio ocupa lo mismo que su figura', () => {
    const bar = insertFigure(emptyBar(16), 'half', 0, { rest: true });
    expect(bar).not.toBeNull();
    expect(usedUnits(bar as RhythmBar)).toBe(8);
    expect(barItems(bar as RhythmBar)[0].rest).toBe(true);
  });

  it('el puntillo se pone si cabe, y se quita', () => {
    const bar = barOf('half', 'quarter');
    const key = bar.figures[0].key;
    const dotted = toggleDot(bar, key);
    expect(dotted).not.toBeNull();
    expect(usedUnits(dotted as RhythmBar)).toBe(16);
    expect(figureSpans(dotted as RhythmBar)[1].start).toBe(12);
    // Ya llena: a la negra no le cabe su puntillo.
    expect(toggleDot(dotted as RhythmBar, bar.figures[1].key)).toBeNull();
    expect(usedUnits(toggleDot(dotted as RhythmBar, key) as RhythmBar)).toBe(12);
  });

  it('se liga una nota con la siguiente, nunca con un silencio ni la última', () => {
    const withRest = insertFigure(barOf('quarter', 'quarter'), 'quarter', 2, { rest: true });
    const bar = withRest as RhythmBar;
    const [first, second, rest] = bar.figures.map((placed) => placed.key);
    const tied = toggleTie(bar, first) as RhythmBar;
    expect(figureSpans(tied)[0].tied).toBe(true);
    expect(toggleTie(bar, second)).toBeNull();
    expect(toggleTie(bar, rest)).toBeNull();
    // Volver a tocarla la desliga.
    expect(figureSpans(toggleTie(tied, first) as RhythmBar)[0].tied).toBe(false);
  });

  it('una ligadura que se queda sin nota siguiente deja de contar', () => {
    const bar = barOf('quarter', 'quarter');
    const tied = toggleTie(bar, bar.figures[0].key) as RhythmBar;
    const alone = removeFigure(tied, bar.figures[1].key);
    expect(barItems(alone)[0].tied).toBe(false);
  });
});
