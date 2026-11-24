import { FIGURES, figureById } from '../figures';
import { beamedGlyph, figureGlyph, itemGlyph, phraseGlyph, restGlyph, tieDepth } from '../glyph';

describe('figureGlyph', () => {
  it('arma cada figura con una pieza por cabeza, plica y corchete', () => {
    expect(FIGURES.map((figure) => figureGlyph(figure).paths.length)).toEqual([1, 2, 2, 3, 4]);
  });

  it('las cabezas huecas llevan un óvalo dentro de otro (el hueco)', () => {
    const subpaths = (d: string) => d.split('M').length - 1;
    expect(subpaths(figureGlyph(figureById('whole')).paths[0])).toBe(2);
    expect(subpaths(figureGlyph(figureById('half')).paths[0])).toBe(2);
    expect(subpaths(figureGlyph(figureById('quarter')).paths[0])).toBe(1);
  });

  it('la cabeza mide un espacio de alto y la plica la eleva ~3,5 espacios', () => {
    const whole = figureGlyph(figureById('whole'));
    expect(whole.height).toBeCloseTo(1.06, 2);
    expect(whole.head.y).toBeCloseTo(whole.height / 2, 3);

    const quarter = figureGlyph(figureById('quarter'));
    expect(quarter.head.y).toBeCloseTo(3.4, 3);
    expect(quarter.height - quarter.head.y).toBeLessThan(0.6);
  });

  it('los corchetes ensanchan la figura y la semicorchea tiene la plica más larga', () => {
    const quarter = figureGlyph(figureById('quarter'));
    const eighth = figureGlyph(figureById('eighth'));
    const sixteenth = figureGlyph(figureById('sixteenth'));
    expect(eighth.width).toBeGreaterThan(quarter.width);
    expect(sixteenth.head.y).toBeGreaterThan(eighth.head.y);
  });

  it('todo el dibujo cae dentro de su caja', () => {
    FIGURES.forEach((figure) => {
      const glyph = figureGlyph(figure);
      glyph.paths.forEach((d) => {
        const pairs = (d.match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) ?? []).map((pair) =>
          pair.split(',').map(Number),
        );
        pairs.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(-0.001);
          expect(x).toBeLessThanOrEqual(glyph.width + 0.001);
          expect(y).toBeGreaterThanOrEqual(-0.001);
          expect(y).toBeLessThanOrEqual(glyph.height + 0.001);
        });
      });
    });
  });
});

describe('beamedGlyph', () => {
  const inBox = (glyph: ReturnType<typeof beamedGlyph>) =>
    glyph.paths.every((d) =>
      (d.match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) ?? []).every((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return x >= -0.001 && x <= glyph.width + 0.001 && y >= -0.001 && y <= glyph.height + 0.001;
      }),
    );

  it('une las plicas con una barra por cada corchete que tendría la figura', () => {
    // cabezas + plicas + barras
    expect(beamedGlyph(figureById('eighth'), 2).paths).toHaveLength(2 + 2 + 1);
    expect(beamedGlyph(figureById('sixteenth'), 2).paths).toHaveLength(2 + 2 + 2);
    expect(beamedGlyph(figureById('eighth'), 4).paths).toHaveLength(4 + 4 + 1);
  });

  it('se ensancha con cada nota y todo cae dentro de su caja', () => {
    const two = beamedGlyph(figureById('eighth'), 2);
    const four = beamedGlyph(figureById('eighth'), 4);
    expect(four.width).toBeGreaterThan(two.width);
    expect(inBox(two)).toBe(true);
    expect(inBox(four)).toBe(true);
    expect(inBox(beamedGlyph(figureById('sixteenth'), 2))).toBe(true);
  });

  it('la cabeza apoya a la misma altura que la figura suelta', () => {
    const eighth = figureById('eighth');
    expect(beamedGlyph(eighth, 2).head.y).toBeCloseTo(figureGlyph(eighth).head.y, 3);
  });

  it('solo se unen figuras con corchetes, de dos en adelante', () => {
    expect(() => beamedGlyph(figureById('quarter'), 2)).toThrow();
    expect(() => beamedGlyph(figureById('eighth'), 1)).toThrow();
  });
});

describe('centro óptico (tinta)', () => {
  it('la redonda es simétrica: su tinta está en el centro de la caja', () => {
    const whole = figureGlyph(figureById('whole'));
    expect(whole.ink.x).toBeCloseTo(whole.width / 2, 3);
  });

  it('la tinta queda dentro de la caja y la blanca pesa menos que la negra (hueco)', () => {
    for (const figure of FIGURES) {
      const glyph = figureGlyph(figure);
      expect(glyph.ink.x).toBeGreaterThan(0);
      expect(glyph.ink.x).toBeLessThan(glyph.width);
    }
    expect(figureGlyph(figureById('half')).ink.area).toBeLessThan(
      figureGlyph(figureById('quarter')).ink.area,
    );
  });

  it('en un grupo unido la barra corre la tinta a la derecha, más con dos barras', () => {
    const shift = (id: 'eighth' | 'sixteenth') => {
      const glyph = beamedGlyph(figureById(id), 4);
      return glyph.ink.x - glyph.width / 2;
    };
    expect(shift('eighth')).toBeGreaterThan(0.2);
    expect(shift('sixteenth')).toBeGreaterThan(shift('eighth'));
  });
});

describe('silencios, puntillo y ligadura (Módulo 4)', () => {
  const inBox = (glyph: ReturnType<typeof itemGlyph>) =>
    [...glyph.paths, ...glyph.marks].every((d) =>
      (d.match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) ?? []).every((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return x >= -0.001 && x <= glyph.width + 0.001 && y >= -0.001 && y <= glyph.height + 0.001;
      }),
    );
  const frameAbove = Math.max(...FIGURES.map((figure) => figureGlyph(figure).head.y));
  const frameBelow = Math.max(
    ...FIGURES.map((figure) => figureGlyph(figure).height - figureGlyph(figure).head.y),
  );

  it('cada silencio sale de las propiedades de su figura y cae dentro de su caja', () => {
    FIGURES.forEach((figure) => {
      const rest = restGlyph(figure, { ledger: true });
      expect(rest.paths.length).toBeGreaterThan(0);
      expect(rest.marks).toHaveLength(0);
      expect(inBox(rest)).toBe(true);
      // Apoyados en la misma línea que las figuras, caben en su mismo marco.
      expect(rest.head.y).toBeLessThanOrEqual(frameAbove + 0.001);
      expect(rest.height - rest.head.y).toBeLessThanOrEqual(frameBelow + 0.001);
    });
  });

  it('el de redonda cuelga de la línea y el de blanca se sienta sobre ella', () => {
    const whole = restGlyph(figureById('whole'));
    const half = restGlyph(figureById('half'));
    expect(whole.head.y).toBeCloseTo(0, 3);
    expect(whole.height).toBeCloseTo(0.5, 3);
    expect(half.head.y).toBeCloseTo(0.5, 3);
    expect(half.height - half.head.y).toBeCloseTo(0, 3);
  });

  it('los de corchea y semicorchea tienen una bolita por corchete', () => {
    // palito + (bolita + bracito) por cada corchete
    expect(restGlyph(figureById('eighth')).paths).toHaveLength(1 + 2);
    expect(restGlyph(figureById('sixteenth')).paths).toHaveLength(1 + 2 * 2);
  });

  it('el puntillo es una marca aparte, a la derecha, y ensancha el dibujo', () => {
    FIGURES.forEach((figure) => {
      [false, true].forEach((rest) => {
        const plain = itemGlyph({ figure, rest, dotted: false });
        const dotted = itemGlyph({ figure, rest, dotted: true });
        expect(dotted.paths).toHaveLength(plain.paths.length);
        expect(dotted.marks).toHaveLength(1);
        expect(dotted.width).toBeGreaterThan(plain.width);
        expect(inBox(dotted)).toBe(true);
      });
    });
  });

  it('la ligadura se curva hacia abajo y une dos figuras en una ficha', () => {
    const quarter = { figure: figureById('quarter'), rest: false, dotted: false };
    const tied = phraseGlyph([quarter, quarter], [true]);
    const loose = phraseGlyph([quarter, quarter], []);
    expect(tied.marks).toHaveLength(1);
    expect(loose.marks).toHaveLength(0);
    expect(tied.height).toBeGreaterThan(loose.height);
    expect(inBox(tied)).toBe(true);
    expect(tieDepth(1)).toBeLessThan(tieDepth(4));
  });
});
