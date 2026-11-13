import { CHORD_LEVELS } from '../chordLevels';
import { voiceChord } from '../chords';
import { evaluateSinging, sungChordFunction, sungNoteName, verdictFor } from '../singingEvaluation';
import { ChordSingingExercise, IntervalSingingExercise } from '../singingGenerator';
import { summarizeSingingRound, SingingRecord } from '../singingSummary';

const C = { letter: 'C', accidental: 0 } as const;

/** Do4 + 5ª justa: hay que cantar Sol4 (67). */
const FIFTH_OVER_C: IntervalSingingExercise = {
  kind: 'singInterval',
  root: C,
  rootOctave: 4,
  rootMidi: 60,
  target: { name: { letter: 'G', accidental: 0 }, octave: 4 },
  targetMidi: 67,
  interval: 'P5',
};

describe('evaluateSinging', () => {
  it('afinado exacto', () => {
    expect(evaluateSinging(FIFTH_OVER_C, 67)).toEqual({
      verdict: 'correct',
      centsOff: 0,
      sungOffset: 7,
    });
  });

  it('acepta la nota en cualquier octava (voz grave una octava abajo)', () => {
    expect(evaluateSinging(FIFTH_OVER_C, 55.1).verdict).toBe('correct');
    expect(evaluateSinging(FIFTH_OVER_C, 55.1).centsOff).toBe(10);
  });

  it('el signo dice si se cantó alto o bajo', () => {
    expect(evaluateSinging(FIFTH_OVER_C, 66.7).centsOff).toBe(-30);
    expect(evaluateSinging(FIFTH_OVER_C, 67.3).centsOff).toBe(30);
  });

  it('distingue afinado, casi y otra nota', () => {
    expect(verdictFor(25)).toBe('correct');
    expect(verdictFor(-26)).toBe('close');
    expect(verdictFor(50)).toBe('close');
    expect(verdictFor(51)).toBe('wrong');
  });

  it('dice qué intervalo se cantó en realidad', () => {
    // Fa4 (65) sobre Do4 = 4ª justa (5 semitonos).
    const evaluation = evaluateSinging(FIFTH_OVER_C, 65);
    expect(evaluation.verdict).toBe('wrong');
    expect(evaluation.sungOffset).toBe(5);
  });

  it('pliega la desviación a la octava más cercana', () => {
    // Do#5 (73) está a 6 semitonos de Sol4 hacia arriba o hacia abajo.
    expect(Math.abs(evaluateSinging(FIFTH_OVER_C, 73).centsOff)).toBe(600);
    expect(evaluateSinging(FIFTH_OVER_C, 68).centsOff).toBe(100);
  });
});

describe('sungNoteName', () => {
  it('nombra la nota cantada con la alteración de la tónica', () => {
    expect(sungNoteName(FIFTH_OVER_C, evaluateSinging(FIFTH_OVER_C, 66))).toEqual({
      letter: 'F',
      accidental: 1,
    });
    const flatRoot = {
      ...FIFTH_OVER_C,
      root: { letter: 'B', accidental: -1 } as const,
      rootMidi: 58,
    };
    expect(sungNoteName(flatRoot, evaluateSinging(flatRoot, 61))).toEqual({
      letter: 'D',
      accidental: -1,
    });
  });
});

describe('sungChordFunction', () => {
  const tones = voiceChord(C, 4, 'majorTriad', 1);
  const exercise: ChordSingingExercise = {
    kind: 'singNote',
    root: C,
    rootOctave: 4,
    rootMidi: 60,
    target: tones[0].note,
    targetMidi: 64,
    sonority: 'majorTriad',
    inversion: 1,
    tones,
    targetFunction: 'third',
  };

  it('reconoce otra nota del acorde, en cualquier octava', () => {
    expect(sungChordFunction(exercise, evaluateSinging(exercise, 55))).toBe('fifth');
    expect(sungChordFunction(exercise, evaluateSinging(exercise, 48))).toBe('root');
  });

  it('null si no es nota del acorde o si el ejercicio es de intervalos', () => {
    expect(sungChordFunction(exercise, evaluateSinging(exercise, 62))).toBeNull();
    expect(sungChordFunction(FIFTH_OVER_C, evaluateSinging(FIFTH_OVER_C, 67))).toBeNull();
  });

  it('el nivel 4 es el único con inversiones', () => {
    expect(CHORD_LEVELS.filter((level) => level.inversions).map((level) => level.number)).toEqual([
      4,
    ]);
  });
});

describe('summarizeSingingRound', () => {
  const record = (overrides: Partial<SingingRecord>): SingingRecord => ({
    target: { kind: 'interval', interval: 'P5' },
    verdict: 'correct',
    centsOff: 0,
    elapsedMs: 1000,
    replayCount: 0,
    ...overrides,
  });

  it('ronda vacía', () => {
    const summary = summarizeSingingRound([]);
    expect(summary.accuracy).toBe(0);
    expect(summary.averageCentsOff).toBeNull();
    expect(summary.tendencyCents).toBeNull();
  });

  it('afinación media solo de las tomas que dieron con la nota', () => {
    const summary = summarizeSingingRound([
      record({ centsOff: -10 }),
      record({ verdict: 'close', centsOff: -30, target: { kind: 'interval', interval: 'M3' } }),
      record({ verdict: 'wrong', centsOff: 400, target: { kind: 'interval', interval: 'M3' } }),
    ]);
    expect(summary.correctCount).toBe(1);
    expect(summary.averageCentsOff).toBe(20);
    expect(summary.tendencyCents).toBe(-20);
    expect(summary.missedTargets).toEqual([{ kind: 'interval', interval: 'M3' }]);
  });

  it('agrupa los fallos por función de acorde', () => {
    const third = { kind: 'chordTone', fn: 'third' } as const;
    const summary = summarizeSingingRound([
      record({ target: third, verdict: 'wrong' }),
      record({ target: third, verdict: 'close' }),
      record({ target: { kind: 'chordTone', fn: 'root' } }),
    ]);
    expect(summary.missedTargets).toEqual([third]);
    expect(summary.averageMs).toBe(1000);
  });
});
