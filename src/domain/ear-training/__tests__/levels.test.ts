import { ALL_INTERVAL_IDS } from '../intervals';
import { EXERCISE_LEVELS, LAST_LEVEL_NUMBER, levelByNumber } from '../levels';

describe('EXERCISE_LEVELS', () => {
  it('son siete niveles numerados de 1 a 7', () => {
    expect(EXERCISE_LEVELS.map((level) => level.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(LAST_LEVEL_NUMBER).toBe(7);
  });

  it('cada nivel contiene todos los intervalos del anterior más los suyos', () => {
    EXERCISE_LEVELS.forEach((level, index) => {
      const previous = EXERCISE_LEVELS[index - 1];
      if (previous) {
        expect(level.intervals).toEqual([...previous.intervals, ...level.added]);
      } else {
        expect(level.intervals).toEqual(level.added);
      }
    });
  });

  it('el nivel 1 empieza por las referencias más estables', () => {
    expect(EXERCISE_LEVELS[0].intervals).toEqual(['P8', 'P5']);
  });

  it('el último nivel cubre los doce intervalos', () => {
    const last = EXERCISE_LEVELS[LAST_LEVEL_NUMBER - 1];
    expect([...last.intervals].sort()).toEqual([...ALL_INTERVAL_IDS].sort());
  });

  it('ningún nivel repite un intervalo', () => {
    for (const level of EXERCISE_LEVELS) {
      expect(new Set(level.intervals).size).toBe(level.intervals.length);
    }
  });
});

describe('levelByNumber', () => {
  it('devuelve el nivel pedido', () => {
    expect(levelByNumber(3)?.number).toBe(3);
  });

  it('devuelve null si el número no existe (parámetro de ruta inválido)', () => {
    expect(levelByNumber(0)).toBeNull();
    expect(levelByNumber(99)).toBeNull();
    expect(levelByNumber(Number.NaN)).toBeNull();
  });
});
