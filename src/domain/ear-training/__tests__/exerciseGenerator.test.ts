import { midiOctave, noteToMidi } from '@/domain/music-theory';

import {
  createExercise,
  createRound,
  EXERCISES_PER_ROUND,
  midiAtInterval,
  OPTIONS_PER_EXERCISE,
  parseExerciseMode,
  RandomSource,
} from '../exerciseGenerator';
import { semitonesOf } from '../intervals';
import { EXERCISE_LEVELS, levelByNumber } from '../levels';

const LEVEL_1 = EXERCISE_LEVELS[0];
const LEVEL_7 = EXERCISE_LEVELS[6];

/** Fuente determinista: recorre en ciclo los valores dados. */
function cyclicRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

/** Fuente "real" pero reproducible (LCG), para las pruebas estadísticas. */
function seededRandom(seed: number): RandomSource {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('createExercise', () => {
  it('la respuesta correcta siempre está entre las opciones', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 200; i += 1) {
      const exercise = createExercise({ level: LEVEL_7, kind: 'interval', random });
      expect(exercise.options).toContain(exercise.answer);
    }
  });

  it('ofrece tres opciones distintas cuando el nivel tiene suficientes', () => {
    const random = seededRandom(11);
    for (let i = 0; i < 100; i += 1) {
      const exercise = createExercise({ level: LEVEL_7, kind: 'note', random });
      expect(exercise.options).toHaveLength(OPTIONS_PER_EXERCISE);
      expect(new Set(exercise.options).size).toBe(OPTIONS_PER_EXERCISE);
    }
  });

  it('en un nivel con solo dos intervalos ofrece dos opciones, no inventa una tercera', () => {
    const exercise = createExercise({
      level: LEVEL_1,
      kind: 'interval',
      random: seededRandom(3),
    });
    expect(exercise.options).toHaveLength(2);
    expect(new Set(exercise.options).size).toBe(2);
  });

  it('solo usa intervalos del nivel', () => {
    const level = levelByNumber(3);
    const random = seededRandom(21);
    for (let i = 0; i < 200; i += 1) {
      const exercise = createExercise({ level: level!, kind: 'interval', random });
      for (const option of exercise.options) {
        expect(level!.intervals).toContain(option);
      }
    }
  });

  it('evita repetir el intervalo del ejercicio anterior si hay alternativa', () => {
    const random = seededRandom(5);
    for (let i = 0; i < 100; i += 1) {
      const exercise = createExercise({
        level: LEVEL_7,
        kind: 'interval',
        random,
        avoid: 'P5',
      });
      expect(exercise.answer).not.toBe('P5');
    }
  });

  it('si el nivel se quedaría sin candidatos, permite repetir en vez de fallar', () => {
    const singleInterval = { ...LEVEL_1, intervals: ['P5'] as const, added: ['P5'] as const };
    const exercise = createExercise({
      level: singleInterval,
      kind: 'interval',
      random: cyclicRandom([0]),
      avoid: 'P5',
    });
    expect(exercise.answer).toBe('P5');
  });

  it('la nota base y todas sus opciones caben en el banco de muestras C4–C6', () => {
    const random = seededRandom(13);
    for (let i = 0; i < 300; i += 1) {
      const exercise = createExercise({ level: LEVEL_7, kind: 'note', random });
      expect(exercise.rootMidi).toBe(noteToMidi({ name: exercise.root, octave: 4 }));
      expect(midiOctave(exercise.rootMidi)).toBe(4);
      for (const option of exercise.options) {
        const midi = midiAtInterval(exercise, option);
        expect(midi).toBeGreaterThanOrEqual(60);
        expect(midi).toBeLessThanOrEqual(84);
      }
    }
  });

  it('midiAtInterval sube exactamente los semitonos del intervalo', () => {
    const exercise = createExercise({
      level: LEVEL_7,
      kind: 'note',
      random: cyclicRandom([0]),
    });
    expect(midiAtInterval(exercise, 'P5') - exercise.rootMidi).toBe(semitonesOf('P5'));
  });
});

describe('createRound', () => {
  it('genera diez ejercicios por defecto', () => {
    const round = createRound({ mode: 'interval', level: LEVEL_7, random: seededRandom(2) });
    expect(round).toHaveLength(EXERCISES_PER_ROUND);
    expect(round.every((exercise) => exercise.kind === 'interval')).toBe(true);
  });

  it('en modo mixto aparecen los dos tipos de ejercicio', () => {
    const round = createRound({
      mode: 'mixed',
      level: LEVEL_7,
      random: seededRandom(9),
      count: 40,
    });
    const kinds = new Set(round.map((exercise) => exercise.kind));
    expect(kinds).toEqual(new Set(['interval', 'note']));
  });

  it('nunca repite el mismo intervalo en dos ejercicios seguidos', () => {
    const round = createRound({
      mode: 'mixed',
      level: LEVEL_7,
      random: seededRandom(4),
      count: 60,
    });
    for (let i = 1; i < round.length; i += 1) {
      expect(round[i].answer).not.toBe(round[i - 1].answer);
    }
  });
});

describe('parseExerciseMode', () => {
  it('acepta los modos conocidos', () => {
    expect(parseExerciseMode('mixed')).toBe('mixed');
    expect(parseExerciseMode('interval')).toBe('interval');
    expect(parseExerciseMode('note')).toBe('note');
  });

  it('rechaza cualquier otra cosa que llegue por la ruta', () => {
    expect(parseExerciseMode('otro')).toBeNull();
    expect(parseExerciseMode(undefined)).toBeNull();
  });
});
