import {
  doubleOf,
  durationRatio,
  figureBeats,
  figureById,
  figureDurationMs,
  FIGURES,
  FigureId,
  halfOf,
  wholeDivisions,
} from '../figures';

const IDS: FigureId[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];

describe('figuras musicales', () => {
  it('van de la que más dura a la que menos y cada una vale la mitad de la anterior', () => {
    expect(FIGURES.map((figure) => figure.id)).toEqual(IDS);
    FIGURES.slice(1).forEach((figure, index) => {
      expect(figure.units * 2).toBe(FIGURES[index].units);
      expect(halfOf(FIGURES[index])).toBe(figure);
      expect(doubleOf(figure)).toBe(FIGURES[index]);
    });
    expect(halfOf(figureById('sixteenth'))).toBeNull();
    expect(doubleOf(figureById('whole'))).toBeNull();
  });

  it('se encuentran por su id', () => {
    IDS.forEach((id) => expect(figureById(id).id).toBe(id));
  });

  it('la negra vale un pulso y las demás una proporción de él', () => {
    expect(IDS.map((id) => figureBeats(figureById(id)))).toEqual([4, 2, 1, 0.5, 0.25]);
  });

  it('no tienen una duración fija: depende del tempo', () => {
    const half = figureById('half');
    expect(figureDurationMs(half, 60)).toBe(2000);
    expect(figureDurationMs(half, 120)).toBe(1000);
    expect(figureDurationMs(figureById('quarter'), 80)).toBe(750);
  });

  it('la blanca dura el doble que la negra', () => {
    expect(durationRatio(figureById('half'), figureById('quarter'))).toBe(2);
    expect(durationRatio(figureById('whole'), figureById('sixteenth'))).toBe(16);
  });

  it('sus propiedades describen cómo se dibujan', () => {
    expect(FIGURES.map((f) => [f.head, f.stem, f.flags])).toEqual([
      ['hollow', false, 0],
      ['hollow', true, 0],
      ['filled', true, 0],
      ['filled', true, 1],
      ['filled', true, 2],
    ]);
  });
});

describe('wholeDivisions', () => {
  it('la redonda es la unidad y cada figura cabe el doble de veces que la anterior', () => {
    expect(FIGURES.map(wholeDivisions)).toEqual([1, 2, 4, 8, 16]);
  });
});
