import { Clip } from './clip';

/**
 * Ejercicios de práctica del Home. Son DATOS serializables (sin funciones):
 * qué se pregunta, qué se ve u oye, las opciones ya barajadas y la respuesta
 * correcta. La pantalla elige cómo pintarlos según `mechanic`.
 */

export interface LessonOption {
  readonly id: string;
  readonly label: string;
}

/** Algo que se puede escuchar con nombre propio ("Primero", "Sonido"). */
export interface LabeledClip {
  readonly label: string;
  readonly clip: Clip;
}

/** Lo que acompaña a la pregunta, encima de las opciones. */
export type Stimulus =
  /**
   * La escalera DO…SI (siete fichas que suben). Solo la primera lleva nombre,
   * como ancla para contar. `clip`: la ficha marcada solo se ilumina al
   * escucharla (asociación guiada sonido → posición).
   */
  | { readonly kind: 'steps'; readonly highlight: number; readonly clip: Clip | null }
  /** Una fila de nombres con un hueco (`null`) que hay que completar. */
  | { readonly kind: 'row'; readonly cells: readonly (string | null)[] }
  /** Uno o varios sonidos que hay que escuchar antes de responder. */
  | { readonly kind: 'clips'; readonly clips: readonly LabeledClip[] };

interface ExerciseBase {
  /** Posición dentro de la plantilla del módulo (1–15). */
  readonly position: number;
  readonly prompt: string;
  /** Corrección breve de una frase, que se muestra al fallar. */
  readonly explanation: string;
}

/** Elegir una respuesta escrita. */
export interface ChoiceExercise extends ExerciseBase {
  readonly mechanic: 'choice';
  readonly stimulus: Stimulus | null;
  readonly options: readonly LessonOption[];
  readonly answer: string;
}

/** Cada opción ES un sonido (o un destello): se escucha y se elige. */
export interface ClipOption extends LessonOption {
  readonly clip: Clip;
  /** Lo que la opción era de verdad, visible solo al corregir ("120 BPM"). */
  readonly reveal: string;
}

export interface ClipChoiceExercise extends ExerciseBase {
  readonly mechanic: 'clip-choice';
  readonly options: readonly ClipOption[];
  readonly answer: string;
}

/** Ordenar fichas tocándolas en orden (sin arrastrar: accesible). */
export interface SequenceExercise extends ExerciseBase {
  readonly mechanic: 'sequence';
  /** Fichas barajadas. */
  readonly tiles: readonly LessonOption[];
  /** Ids de las fichas en el orden correcto. */
  readonly answer: readonly string[];
}

/** Tocar siguiendo un pulso. */
export interface TapExercise extends ExerciseBase {
  readonly mechanic: 'tap';
  readonly bpm: number;
  /** Golpes de entrada que solo se escuchan (no se califican). */
  readonly countIn: number;
  /** Golpes que se califican, tras la entrada. */
  readonly beats: number;
  /**
   * Cuántos golpes (contando la entrada) se ven iluminados. Igual al total =
   * guía constante; igual a `countIn` = solo se ve la entrada y luego se toca
   * de oído.
   */
  readonly guideBeats: number;
}

export type LessonExercise = ChoiceExercise | ClipChoiceExercise | SequenceExercise | TapExercise;

export type ExerciseMechanic = LessonExercise['mechanic'];

/** Lo que respondió el usuario, según la mecánica. */
export type LessonAnswer =
  | { readonly kind: 'option'; readonly id: string }
  | { readonly kind: 'sequence'; readonly ids: readonly string[] }
  /** El tap ya se calificó al terminar (`judgeTaps`); aquí llega su veredicto. */
  | { readonly kind: 'tap'; readonly passed: boolean };

export function isAnswerCorrect(exercise: LessonExercise, answer: LessonAnswer): boolean {
  switch (exercise.mechanic) {
    case 'choice':
    case 'clip-choice':
      return answer.kind === 'option' && answer.id === exercise.answer;
    case 'sequence':
      return (
        answer.kind === 'sequence' &&
        answer.ids.length === exercise.answer.length &&
        firstSequenceError(exercise.answer, answer.ids) === null
      );
    case 'tap':
      return answer.kind === 'tap' && answer.passed;
  }
}

/**
 * Primera posición en la que una secuencia se aparta de la correcta, o `null`
 * si está bien. Es la que se resalta al corregir.
 */
export function firstSequenceError(
  answer: readonly string[],
  given: readonly string[],
): number | null {
  for (let i = 0; i < answer.length; i += 1) {
    if (given[i] !== answer[i]) return i;
  }
  return null;
}

/** ¿El ejercicio pide escuchar algo antes de habilitar la respuesta? */
export function stimulusClips(exercise: LessonExercise): readonly Clip[] {
  if (exercise.mechanic !== 'choice' || exercise.stimulus === null) return [];
  return clipsOfStimulus(exercise.stimulus);
}

/** Sonidos de un estímulo, en el orden en que se muestran sus botones. */
export function clipsOfStimulus(stimulus: Stimulus): readonly Clip[] {
  if (stimulus.kind === 'clips') return stimulus.clips.map((item) => item.clip);
  if (stimulus.kind === 'steps' && stimulus.clip !== null) return [stimulus.clip];
  return [];
}
