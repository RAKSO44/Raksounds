import { isRoundCleared, roundOutcome } from '../roundOutcome';

describe('roundOutcome', () => {
  it('80 % o más es una ronda dominada', () => {
    expect(roundOutcome(1)).toBe('great');
    expect(roundOutcome(0.8)).toBe('great');
  });

  it('de la mitad a 79 % se supera con margen de mejora', () => {
    expect(roundOutcome(0.79)).toBe('passed');
    expect(roundOutcome(0.5)).toBe('passed');
  });

  it('menos de la mitad no se supera', () => {
    expect(roundOutcome(0.49)).toBe('failed');
    expect(roundOutcome(0)).toBe('failed');
  });
});

describe('isRoundCleared', () => {
  it('cuenta como superada a partir de la mitad de aciertos', () => {
    expect(isRoundCleared(0.5)).toBe(true);
    expect(isRoundCleared(0.4)).toBe(false);
  });
});
