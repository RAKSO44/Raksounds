import { IntervalId } from '../intervals';
import { AnswerRecord, countReplays, summarizeRound } from '../roundSummary';

function record(
  answer: IntervalId,
  chosen: IntervalId,
  elapsedMs: number,
  replayCount = 0,
): AnswerRecord {
  return { kind: 'interval', answer, chosen, elapsedMs, replayCount };
}

describe('countReplays', () => {
  it('la primera vez que suena cada tecla no cuenta', () => {
    // El ejercicio de nota: la base y las tres opciones, una vez cada una.
    expect(countReplays(['root', 'option-0', 'option-1', 'option-2'])).toBe(0);
  });

  it('cada vuelta a una tecla ya oída suma una repetición', () => {
    // Base, opción A, otra vez la base, otra vez la A y una tercera vez la A.
    expect(countReplays(['root', 'option-0', 'root', 'option-0', 'option-0'])).toBe(3);
  });

  it('sin escuchas no hay repeticiones', () => {
    expect(countReplays([])).toBe(0);
  });
});

describe('summarizeRound', () => {
  it('cuenta aciertos y calcula porcentaje y tiempo medio', () => {
    const summary = summarizeRound([
      record('P5', 'P5', 1000),
      record('P8', 'P8', 3000),
      record('M3', 'm3', 2000),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.correctCount).toBe(2);
    expect(summary.accuracy).toBeCloseTo(2 / 3);
    expect(summary.averageMs).toBe(2000);
  });

  it('lista los intervalos fallados sin repetir y en orden de aparición', () => {
    const summary = summarizeRound([
      record('M3', 'm3', 1000),
      record('P4', 'P4', 1000),
      record('m6', 'M6', 1000),
      record('M3', 'P5', 1000),
    ]);

    expect(summary.missedIntervals).toEqual(['M3', 'm6']);
  });

  it('el intervalo más rápido sale solo de las respuestas correctas', () => {
    const summary = summarizeRound([
      // La más rápida de todas, pero fallada: no cuenta.
      record('TT', 'P5', 300),
      record('P5', 'P5', 900),
      record('P8', 'P8', 2500),
    ]);

    expect(summary.fastestInterval).toBe('P5');
    expect(summary.fastestMs).toBe(900);
  });

  it('promedia cuántas veces se repitió una nota por pregunta', () => {
    const summary = summarizeRound([
      record('P5', 'P5', 1000, 2),
      record('P8', 'P8', 1000, 5),
      record('P4', 'P4', 1000, 2),
    ]);

    expect(summary.averageReplays).toBe(3);
  });

  it('sin aciertos no hay intervalo más rápido', () => {
    const summary = summarizeRound([record('P5', 'P8', 1000)]);

    expect(summary.fastestInterval).toBeNull();
    expect(summary.fastestMs).toBeNull();
  });

  it('una ronda vacía no divide por cero', () => {
    const summary = summarizeRound([]);

    expect(summary.accuracy).toBe(0);
    expect(summary.averageMs).toBe(0);
    expect(summary.averageReplays).toBe(0);
    expect(summary.missedIntervals).toEqual([]);
  });
});
