import { CHROMATIC_ROOTS, Note, NoteName, noteToMidi } from '../music-theory';
import {
  EXERCISE_LEVELS,
  EXERCISE_ROOT_OCTAVE,
  EXERCISES_PER_ROUND,
  ExerciseLevel,
  IntervalId,
  levelByNumber,
  noteAtInterval,
  RandomSource,
} from '../ear-training';
import { CHORD_LEVELS, ChordLevel, chordLevelByNumber } from './chordLevels';
import { ChordFunction, ChordTone, positionCount, SonorityId, voiceChord } from './chords';

/**
 * Generación de ejercicios de entonación. Igual que en el entrenamiento
 * auditivo, la aleatoriedad entra como parámetro para que una ronda sea
 * reproducible en los tests.
 */

export type SingingKind =
  /** Suena una nota base; hay que cantar el intervalo pedido sobre ella. */
  | 'singInterval'
  /** Suenan varias notas a la vez; hay que cantar la de la función pedida. */
  | 'singNote';

export const SINGING_KINDS: readonly SingingKind[] = ['singInterval', 'singNote'];

interface SingingExerciseBase {
  /** Fundamental (o nota base) con su deletreo. */
  readonly root: NoteName;
  readonly rootOctave: number;
  readonly rootMidi: number;
  /** Nota que hay que cantar, deletreada (para mostrarla al corregir). */
  readonly target: Note;
  readonly targetMidi: number;
}

export interface IntervalSingingExercise extends SingingExerciseBase {
  readonly kind: 'singInterval';
  /** Intervalo ascendente pedido. */
  readonly interval: IntervalId;
}

export interface ChordSingingExercise extends SingingExerciseBase {
  readonly kind: 'singNote';
  readonly sonority: SonorityId;
  /** 0 = estado fundamental, 1 = primera inversión… */
  readonly inversion: number;
  /** Lo que suena, de grave a agudo. */
  readonly tones: readonly ChordTone[];
  /** Función de la nota que hay que cantar. */
  readonly targetFunction: ChordFunction;
}

export type SingingExercise = IntervalSingingExercise | ChordSingingExercise;

function pickIndex(length: number, random: RandomSource): number {
  // Math.min protege del caso límite random() === 1 de una fuente mal portada.
  return Math.min(length - 1, Math.floor(random() * length));
}

function pick<T>(items: readonly T[], random: RandomSource): T {
  return items[pickIndex(items.length, random)];
}

/** Elige evitando `avoid` si queda alternativa (si no, la ronda se volvería A B A B…). */
function pickAvoiding<T>(
  items: readonly T[],
  random: RandomSource,
  isAvoided: (item: T) => boolean,
): T {
  const candidates = items.filter((item) => !isAvoided(item));
  return pick(candidates.length > 0 ? candidates : items, random);
}

function rootMidiOf(root: NoteName): number {
  return noteToMidi({ name: root, octave: EXERCISE_ROOT_OCTAVE });
}

interface IntervalRoundOptions {
  readonly level: ExerciseLevel;
  readonly random: RandomSource;
  readonly count?: number;
}

/** Ronda de entonación de intervalos. Usa los mismos 7 niveles que la identificación. */
export function createIntervalSingingRound({
  level,
  random,
  count = EXERCISES_PER_ROUND,
}: IntervalRoundOptions): readonly IntervalSingingExercise[] {
  const exercises: IntervalSingingExercise[] = [];
  for (let i = 0; i < count; i += 1) {
    const previous = exercises[i - 1]?.interval;
    const interval =
      level.intervals.length > 2
        ? pickAvoiding(level.intervals, random, (id) => id === previous)
        : pick(level.intervals, random);
    const root = pick(CHROMATIC_ROOTS, random);
    const target = noteAtInterval(root, EXERCISE_ROOT_OCTAVE, interval);
    // Con las 12 tónicas de la app el deletreo siempre existe (ver intervals.ts).
    if (target === null) throw new Error(`No se puede deletrear ${interval} sobre la tónica`);

    exercises.push({
      kind: 'singInterval',
      root,
      rootOctave: EXERCISE_ROOT_OCTAVE,
      rootMidi: rootMidiOf(root),
      target,
      targetMidi: noteToMidi(target),
      interval,
    });
  }
  return exercises;
}

interface ChordRoundOptions {
  readonly level: ChordLevel;
  readonly random: RandomSource;
  readonly count?: number;
}

/** Combinación sonoridad + función: lo que hace "distinta" una pregunta de la anterior. */
interface ChordQuestion {
  readonly sonority: SonorityId;
  readonly fn: ChordFunction;
}

export function createChordSingingRound({
  level,
  random,
  count = EXERCISES_PER_ROUND,
}: ChordRoundOptions): readonly ChordSingingExercise[] {
  const exercises: ChordSingingExercise[] = [];
  for (let i = 0; i < count; i += 1) {
    const previous = exercises[i - 1];
    const sonority = pick(level.sonorities, random);
    const inversion = level.inversions ? pickIndex(positionCount(sonority), random) : 0;
    const root = pick(CHROMATIC_ROOTS, random);
    const tones = voiceChord(root, EXERCISE_ROOT_OCTAVE, sonority, inversion);

    // No se pide dos veces seguidas lo mismo (p. ej. "la 5ª de una tríada
    // mayor"), salvo que el nivel no tenga otra cosa que pedir.
    const questions: ChordQuestion[] = tones.map((tone) => ({ sonority, fn: tone.fn }));
    const question = pickAvoiding(
      questions,
      random,
      (q) =>
        previous !== undefined &&
        q.sonority === previous.sonority &&
        q.fn === previous.targetFunction,
    );
    const target = tones.find((tone) => tone.fn === question.fn);
    if (target === undefined) throw new Error('La función pedida no está en el acorde');

    exercises.push({
      kind: 'singNote',
      root,
      rootOctave: EXERCISE_ROOT_OCTAVE,
      rootMidi: rootMidiOf(root),
      target: target.note,
      targetMidi: target.midi,
      sonority,
      inversion,
      tones,
      targetFunction: question.fn,
    });
  }
  return exercises;
}

interface SingingRoundOptions {
  readonly kind: SingingKind;
  /** Número de nivel; uno inexistente cae en el nivel 1 en vez de fallar. */
  readonly levelNumber: number;
  readonly random: RandomSource;
  readonly count?: number;
}

/**
 * Ronda de cualquiera de los dos tipos. Cada tipo tiene su propia escala de
 * niveles: los 7 de intervalos para cantar intervalos, los 5 de acordes para
 * cantar notas.
 */
export function createSingingRound({
  kind,
  levelNumber,
  random,
  count,
}: SingingRoundOptions): readonly SingingExercise[] {
  if (kind === 'singInterval') {
    const level = levelByNumber(levelNumber) ?? EXERCISE_LEVELS[0];
    return createIntervalSingingRound({ level, random, count });
  }
  const level = chordLevelByNumber(levelNumber) ?? CHORD_LEVELS[0];
  return createChordSingingRound({ level, random, count });
}

/** Valida un tipo llegado de fuera (parámetro de ruta). */
export function parseSingingKind(value: string | undefined): SingingKind | null {
  return SINGING_KINDS.find((kind) => kind === value) ?? null;
}
