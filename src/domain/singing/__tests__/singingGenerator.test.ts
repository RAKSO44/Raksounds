import {
  EXERCISE_LEVELS,
  EXERCISES_PER_ROUND,
  RandomSource,
  semitonesOf,
} from '@/domain/ear-training';
import { noteToMidi } from '@/domain/music-theory';

import { CHORD_LEVELS, chordLevelByNumber } from '../chordLevels';
import {
  createChordSingingRound,
  createIntervalSingingRound,
  createSingingRound,
  parseSingingKind,
} from '../singingGenerator';

/** Fuente reproducible (LCG). */
function seededRandom(seed: number): RandomSource {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

describe('createIntervalSingingRound', () => {
  it('genera una ronda completa con intervalos del nivel y objetivo coherente', () => {
    const level = EXERCISE_LEVELS[3];
    const round = createIntervalSingingRound({ level, random: seededRandom(1) });

    expect(round).toHaveLength(EXERCISES_PER_ROUND);
    for (const exercise of round) {
      expect(level.intervals).toContain(exercise.interval);
      expect(exercise.targetMidi - exercise.rootMidi).toBe(semitonesOf(exercise.interval));
      expect(noteToMidi(exercise.target)).toBe(exercise.targetMidi);
      expect(exercise.rootOctave).toBe(4);
    }
  });

  it('no repite el mismo intervalo dos veces seguidas cuando hay alternativa', () => {
    const round = createIntervalSingingRound({
      level: EXERCISE_LEVELS[6],
      random: seededRandom(3),
      count: 50,
    });
    for (let i = 1; i < round.length; i += 1) {
      expect(round[i].interval).not.toBe(round[i - 1].interval);
    }
  });
});

describe('createChordSingingRound', () => {
  it('nivel 1: una sola nota y se pide esa misma', () => {
    const round = createChordSingingRound({ level: CHORD_LEVELS[0], random: seededRandom(5) });
    for (const exercise of round) {
      expect(exercise.tones).toHaveLength(1);
      expect(exercise.targetFunction).toBe('root');
      expect(exercise.targetMidi).toBe(exercise.rootMidi);
    }
  });

  it('cada nivel suena con el número de notas que le toca', () => {
    const expectedSizes = [1, 2, 3, 3, 4];
    CHORD_LEVELS.forEach((level, index) => {
      const round = createChordSingingRound({ level, random: seededRandom(index + 10) });
      for (const exercise of round) expect(exercise.tones).toHaveLength(expectedSizes[index]);
    });
  });

  it('la nota pedida siempre está en el acorde', () => {
    for (const level of CHORD_LEVELS) {
      for (const exercise of createChordSingingRound({
        level,
        random: seededRandom(level.number),
        count: 40,
      })) {
        const target = exercise.tones.find((tone) => tone.fn === exercise.targetFunction);
        expect(target?.midi).toBe(exercise.targetMidi);
      }
    }
  });

  it('sin inversiones salvo en el nivel que las incluye', () => {
    const plain = createChordSingingRound({
      level: CHORD_LEVELS[2],
      random: seededRandom(7),
      count: 40,
    });
    expect(plain.every((exercise) => exercise.inversion === 0)).toBe(true);

    const inverted = createChordSingingRound({
      level: CHORD_LEVELS[3],
      random: seededRandom(7),
      count: 60,
    });
    expect(new Set(inverted.map((exercise) => exercise.inversion))).toEqual(new Set([0, 1, 2]));
  });

  it('no pide dos veces seguidas la misma función del mismo acorde cuando hay alternativa', () => {
    const round = createChordSingingRound({
      level: CHORD_LEVELS[2],
      random: seededRandom(9),
      count: 60,
    });
    for (let i = 1; i < round.length; i += 1) {
      const same =
        round[i].sonority === round[i - 1].sonority &&
        round[i].targetFunction === round[i - 1].targetFunction;
      expect(same).toBe(false);
    }
  });
});

describe('niveles y parámetros', () => {
  it('chordLevelByNumber', () => {
    expect(chordLevelByNumber(5)?.sonorities).toContain('dominantSeventh');
    expect(chordLevelByNumber(9)).toBeNull();
  });

  it('parseSingingKind', () => {
    expect(parseSingingKind('singNote')).toBe('singNote');
    expect(parseSingingKind('interval')).toBeNull();
    expect(parseSingingKind(undefined)).toBeNull();
  });
});

describe('createSingingRound', () => {
  it('elige la escala de niveles según el tipo', () => {
    const intervals = createSingingRound({
      kind: 'singInterval',
      levelNumber: 7,
      random: seededRandom(2),
    });
    expect(intervals.every((exercise) => exercise.kind === 'singInterval')).toBe(true);

    const chords = createSingingRound({
      kind: 'singNote',
      levelNumber: 5,
      random: seededRandom(2),
    });
    expect(
      chords.every((exercise) => exercise.kind === 'singNote' && exercise.tones.length === 4),
    ).toBe(true);
  });

  it('un nivel inexistente cae en el nivel 1', () => {
    const round = createSingingRound({
      kind: 'singNote',
      levelNumber: 99,
      random: seededRandom(4),
    });
    expect(
      round.every((exercise) => exercise.kind === 'singNote' && exercise.tones.length === 1),
    ).toBe(true);
  });
});
