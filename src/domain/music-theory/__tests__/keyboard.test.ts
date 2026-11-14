import { buildKeyboard, isBlackKey, keyboardRangeFor } from '../keyboard';

describe('isBlackKey', () => {
  it('C, D, E, F, G, A y B son blancas; sus alteraciones, negras', () => {
    const blacks = Array.from({ length: 12 }, (_, i) => 60 + i).filter(isBlackKey);
    expect(blacks).toEqual([61, 63, 66, 68, 70]);
  });

  it('no hay negra entre E–F ni entre B–C', () => {
    expect(isBlackKey(64)).toBe(false); // E4
    expect(isBlackKey(65)).toBe(false); // F4
    expect(isBlackKey(71)).toBe(false); // B4
    expect(isBlackKey(72)).toBe(false); // C5
  });
});

describe('buildKeyboard', () => {
  it('una octava C4–B4: 7 blancas y 5 negras, blancas primero', () => {
    const layout = buildKeyboard(60, 71);
    expect(layout.whiteKeyCount).toBe(7);
    expect(layout.keys).toHaveLength(12);
    expect(layout.keys.slice(0, 7).every((key) => !key.black)).toBe(true);
  });

  it('cada negra se centra sobre la juntura de sus blancas', () => {
    const layout = buildKeyboard(60, 71);
    const cSharp = layout.keys.find((key) => key.midi === 61);
    const fSharp = layout.keys.find((key) => key.midi === 66);
    // C# entre C (0–1) y D (1–2): centro en 1.
    expect(cSharp!.left + cSharp!.width / 2).toBeCloseTo(1);
    // F# entre F (3–4) y G (4–5): centro en 4.
    expect(fSharp!.left + fSharp!.width / 2).toBeCloseTo(4);
  });

  it('rechaza extremos en tecla negra', () => {
    expect(() => buildKeyboard(61, 71)).toThrow();
    expect(() => buildKeyboard(60, 70)).toThrow();
  });
});

describe('keyboardRangeFor', () => {
  it('deja una blanca libre a cada lado', () => {
    // E4–G4–B4 (Mi menor): de D4 a C5.
    expect(keyboardRangeFor([64, 67, 71], 0)).toEqual({ low: 62, high: 72 });
  });

  it('si la nota extrema es negra, el borde es la blanca contigua', () => {
    // C#4–F4: de C4 a G4.
    expect(keyboardRangeFor([61, 65], 0)).toEqual({ low: 60, high: 67 });
  });

  it('alarga alternando arriba y abajo hasta el mínimo de blancas', () => {
    const { low, high } = keyboardRangeFor([60], 6);
    // C4 sola: B3–D4 (3 blancas) → E4, A3, F4.
    expect({ low, high }).toEqual({ low: 57, high: 65 });
    expect(buildKeyboard(low, high).whiteKeyCount).toBe(6);
  });

  it('todas las notas pedidas caen dentro del teclado', () => {
    const midis = [63, 67, 70, 74];
    const { low, high } = keyboardRangeFor(midis, 10);
    const keys = buildKeyboard(low, high).keys.map((key) => key.midi);
    midis.forEach((midi) => expect(keys).toContain(midi));
  });
});
