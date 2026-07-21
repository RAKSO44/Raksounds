import { DEFAULT_VOLUME, volumeToGain } from '../volume';

describe('volumeToGain', () => {
  it('el punto medio del deslizable es el volumen normal (ganancia 1)', () => {
    expect(volumeToGain(DEFAULT_VOLUME)).toBeCloseTo(1);
  });

  it('todo a la izquierda es silencio', () => {
    expect(volumeToGain(0)).toBe(0);
  });

  it('todo a la derecha amplifica por encima del normal', () => {
    expect(volumeToGain(1)).toBeCloseTo(4);
  });

  it('crece de forma monótona a lo largo del recorrido', () => {
    const steps = Array.from({ length: 21 }, (_, i) => volumeToGain(i / 20));
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });

  it('recorta valores fuera de rango en vez de extrapolar', () => {
    expect(volumeToGain(-1)).toBe(0);
    expect(volumeToGain(3)).toBeCloseTo(4);
  });
});
