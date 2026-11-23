import { sampleOnset } from '../sampleOnset';

const signal = (values: number[]) => Float32Array.from(values);

describe('sampleOnset', () => {
  it('salta el silencio inicial hasta el ataque', () => {
    expect(sampleOnset(signal([0, 0, 0, 0.5, 1, 0.6]), 0.1)).toBe(3);
  });

  it('ignora el ruido de fondo por debajo del umbral, relativo al pico', () => {
    // El aire de la grabación no es el ataque, aunque no sea cero.
    expect(sampleOnset(signal([0.01, -0.02, 0.015, -0.9, 0.7]), 0.1)).toBe(3);
  });

  it('cuenta los valores negativos (la onda puede empezar hacia abajo)', () => {
    expect(sampleOnset(signal([0, 0, -0.8, 0.4]), 0.1)).toBe(2);
  });

  it('una muestra que empieza sonando arranca en 0', () => {
    expect(sampleOnset(signal([0.9, 0.5, 0.2]), 0.1)).toBe(0);
  });

  it('una muestra muda arranca en 0', () => {
    expect(sampleOnset(signal([0, 0, 0]), 0.1)).toBe(0);
    expect(sampleOnset(signal([]), 0.1)).toBe(0);
  });
});
