import { CHROMATIC_ROOTS, NoteName, noteToMidi } from '../music-theory';
import { IntervalId, semitonesOf } from './intervals';
import { ExerciseLevel } from './levels';

/**
 * Generación de ejercicios auditivos. Todo es puro: la aleatoriedad entra como
 * parámetro (`RandomSource`), de modo que una ronda se puede reproducir tal cual
 * en los tests sin mockear `Math.random` global.
 */

/** Tipo de ejercicio. */
export type ExerciseKind =
  /** Suenan dos notas; hay que decir QUÉ INTERVALO forman. */
  | 'interval'
  /** Suena la base y tres candidatas; hay que decir CUÁL está al intervalo pedido. */
  | 'note';

/** Lo que el usuario elige en el menú: un tipo concreto o los dos mezclados. */
export type ExerciseMode = ExerciseKind | 'mixed';

export const EXERCISE_MODES: readonly ExerciseMode[] = ['mixed', 'interval', 'note'];

export const EXERCISE_KINDS: readonly ExerciseKind[] = ['interval', 'note'];

/** Devuelve un número en [0, 1), como `Math.random`. */
export type RandomSource = () => number;

/**
 * Octava de la nota base. La tónica vive en C4–B4, así que la nota más aguda
 * posible (base + octava justa) es B5: justo dentro del banco de muestras
 * C4–C6 que carga el sampler.
 */
export const EXERCISE_ROOT_OCTAVE = 4;

/** Opciones que se muestran por ejercicio (menos si el nivel no tiene tantas). */
export const OPTIONS_PER_EXERCISE = 3;

/** Ejercicios de una ronda completa. */
export const EXERCISES_PER_ROUND = 10;

export interface Exercise {
  readonly kind: ExerciseKind;
  /** Deletreo de la nota base (la que el usuario siempre ve). */
  readonly root: NoteName;
  readonly rootOctave: number;
  /** Altura MIDI de la nota base. */
  readonly rootMidi: number;
  /** Intervalo correcto: el que hay que identificar o el que se pide buscar. */
  readonly answer: IntervalId;
  /** Opciones barajadas; siempre incluyen a `answer`. */
  readonly options: readonly IntervalId[];
}

/** Altura MIDI de la nota que está a `interval` de la base del ejercicio. */
export function midiAtInterval(exercise: Exercise, interval: IntervalId): number {
  return exercise.rootMidi + semitonesOf(interval);
}

function pickIndex(length: number, random: RandomSource): number {
  // Math.min protege del caso límite random() === 1 de una fuente mal portada.
  return Math.min(length - 1, Math.floor(random() * length));
}

function pick<T>(items: readonly T[], random: RandomSource): T {
  return items[pickIndex(items.length, random)];
}

/** Fisher-Yates sobre una copia: la entrada nunca se muta. */
function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = pickIndex(i + 1, random);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface ExerciseOptions {
  readonly level: ExerciseLevel;
  readonly kind: ExerciseKind;
  readonly random: RandomSource;
  /** Intervalo del ejercicio anterior; se evita repetirlo dos veces seguidas. */
  readonly avoid?: IntervalId;
}

export function createExercise({ level, kind, random, avoid }: ExerciseOptions): Exercise {
  // Solo se evita la repetición si queda alternativa: en el nivel 1 hay dos
  // intervalos y forzar la variedad haría la ronda predecible (A B A B...),
  // así que ahí se permite repetir.
  const candidates = level.intervals.filter((id) => id !== avoid);
  const answer = pick(candidates.length > 1 ? candidates : level.intervals, random);

  const distractors = shuffle(
    level.intervals.filter((id) => id !== answer),
    random,
  ).slice(0, OPTIONS_PER_EXERCISE - 1);

  const root = pick(CHROMATIC_ROOTS, random);

  return {
    kind,
    root,
    rootOctave: EXERCISE_ROOT_OCTAVE,
    rootMidi: noteToMidi({ name: root, octave: EXERCISE_ROOT_OCTAVE }),
    answer,
    options: shuffle([answer, ...distractors], random),
  };
}

interface RoundOptions {
  readonly mode: ExerciseMode;
  readonly level: ExerciseLevel;
  readonly random: RandomSource;
  readonly count?: number;
}

/** Ronda completa: la lista de ejercicios se fija de una vez al empezar. */
export function createRound({
  mode,
  level,
  random,
  count = EXERCISES_PER_ROUND,
}: RoundOptions): readonly Exercise[] {
  const exercises: Exercise[] = [];
  for (let i = 0; i < count; i += 1) {
    const kind = mode === 'mixed' ? pick(EXERCISE_KINDS, random) : mode;
    exercises.push(createExercise({ level, kind, random, avoid: exercises[i - 1]?.answer }));
  }
  return exercises;
}

/** Valida un modo llegado de fuera (parámetro de ruta). */
export function parseExerciseMode(value: string | undefined): ExerciseMode | null {
  return EXERCISE_MODES.find((mode) => mode === value) ?? null;
}
