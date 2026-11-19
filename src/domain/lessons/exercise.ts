import { Clip } from './clip';

/**
 * Ejercicios de práctica del Home. Son DATOS serializables (sin funciones):
 * qué se pregunta, qué se ve u oye, las opciones ya barajadas y la respuesta
 * correcta. La pantalla elige cómo pintarlos según `mechanic`.
 */

export interface LessonOption {
  readonly id: string;
  readonly label: string;
  /** Nota que suena al tocar la opción (una ficha de nota que se oye). */
  readonly midi?: number;
}

/**
 * Algo que se puede escuchar con nombre propio ("Primero", "Segundo"). Sin
 * `label` el botón es solo el ícono de escuchar (no debe delatar qué suena) y
 * `name` lo describe para el lector de pantalla.
 */
export interface LabeledClip {
  readonly label?: string;
  readonly name?: string;
  readonly clip: Clip;
}

/** Una casilla de una fila de notas: su nombre (`null` = el hueco) y su altura. */
export interface RowCell {
  readonly label: string | null;
  readonly midi: number;
}

/** Lo que acompaña a la pregunta, encima de las opciones. */
export type Stimulus =
  /**
   * La escala DO…SI como barras que suben; cada barra suena al tocarla
   * (`midis`). Al corregir, todas muestran su nombre.
   * - Sin `listen`: la barra `highlight` va marcada desde el principio y solo
   *   DO lleva nombre, como ancla para contar.
   * - Con `listen`: suena una nota y ninguna barra lleva nombre ni marca; la
   *   que sonó se pinta recién al corregir.
   */
  | {
      readonly kind: 'steps';
      readonly highlight: number;
      readonly midis: readonly number[];
      readonly listen: Clip | null;
    }
  /**
   * Una fila de notas con un hueco que hay que completar. Las notas suenan al
   * tocarlas; el hueco, solo después de corregir.
   */
  | { readonly kind: 'row'; readonly cells: readonly RowCell[] }
  /** Uno o varios sonidos que hay que escuchar antes de responder. */
  | { readonly kind: 'clips'; readonly clips: readonly LabeledClip[] }
  /**
   * Metrónomos que se encienden y apagan a voluntad (suena uno a la vez). Su
   * BPM no se ve hasta corregir.
   */
  | { readonly kind: 'metronomes'; readonly bpms: readonly number[] };

interface ExerciseBase {
  /** Posición dentro de la plantilla del módulo (desde 1). */
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

/** Cada opción ES un sonido: se escucha y se elige. */
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

/**
 * Ordenar fichas: se tocan en orden o se arrastran a su hueco. Si traen
 * `midi`, suenan al tocarlas.
 */
export interface SequenceExercise extends ExerciseBase {
  readonly mechanic: 'sequence';
  /** Fichas barajadas. */
  readonly tiles: readonly LessonOption[];
  /** Ids de las fichas en el orden correcto. */
  readonly answer: readonly string[];
}

/**
 * Tocar siguiendo un pulso que suena sin parar: se empieza cuando se quiere y
 * se califican los `taps` toques, que deben caer en golpes seguidos.
 */
export interface TapExercise extends ExerciseBase {
  readonly mechanic: 'tap';
  readonly bpm: number;
  readonly taps: number;
}

/** Una opción que es un pulso sin fin a su BPM (oculto hasta corregir). */
export interface TempoOption extends LessonOption {
  readonly bpm: number;
}

/**
 * Elegir entre pulsos. Elegir una opción la hace sonar sin parar; elegirla de
 * nuevo la deselecciona y la apaga.
 */
export interface TempoChoiceExercise extends ExerciseBase {
  readonly mechanic: 'tempo-choice';
  readonly options: readonly TempoOption[];
  readonly answer: string;
}

/** Marcar, entre varios sonidos, los `answer.length` que van juntos. */
export interface PickExercise extends ExerciseBase {
  readonly mechanic: 'pick';
  /** Cada opción es un sonido; `reveal` es la nota que era, visible al corregir. */
  readonly options: readonly ClipOption[];
  /** Ids que hay que marcar (en cualquier orden). */
  readonly answer: readonly string[];
}

export type LessonExercise =
  | ChoiceExercise
  | ClipChoiceExercise
  | TempoChoiceExercise
  | SequenceExercise
  | TapExercise
  | PickExercise;

export type ExerciseMechanic = LessonExercise['mechanic'];

/** Lo que respondió el usuario, según la mecánica. */
export type LessonAnswer =
  | { readonly kind: 'option'; readonly id: string }
  | { readonly kind: 'sequence'; readonly ids: readonly string[] }
  /** Las opciones marcadas, sin orden. */
  | { readonly kind: 'set'; readonly ids: readonly string[] }
  /** El tap ya se calificó al terminar (`judgeTapsOnPulse`); aquí llega su veredicto. */
  | { readonly kind: 'tap'; readonly passed: boolean };

export function isAnswerCorrect(exercise: LessonExercise, answer: LessonAnswer): boolean {
  switch (exercise.mechanic) {
    case 'choice':
    case 'clip-choice':
    case 'tempo-choice':
      return answer.kind === 'option' && answer.id === exercise.answer;
    case 'sequence':
      return (
        answer.kind === 'sequence' &&
        answer.ids.length === exercise.answer.length &&
        firstSequenceError(exercise.answer, answer.ids) === null
      );
    case 'tap':
      return answer.kind === 'tap' && answer.passed;
    case 'pick':
      return (
        answer.kind === 'set' &&
        answer.ids.length === exercise.answer.length &&
        exercise.answer.every((id) => answer.ids.includes(id))
      );
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
  if (stimulus.kind === 'steps' && stimulus.listen !== null) return [stimulus.listen];
  return [];
}
