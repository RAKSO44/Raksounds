import { figureById, FigureId } from '../rhythm';
import { Clip } from './clip';

/**
 * Ejercicios de práctica del Home. Son DATOS serializables (sin funciones):
 * qué se pregunta, qué se ve u oye, las opciones ya barajadas y la respuesta
 * correcta. La pantalla elige cómo pintarlos según `mechanic`.
 */

/**
 * Figuras musicales escritas (Módulo 3): una o varias sueltas en fila, o
 * varias unidas por barras (que se escriben distinto pero duran lo mismo).
 */
export type Notation =
  | { readonly kind: 'figures'; readonly figures: readonly FigureId[] }
  | { readonly kind: 'beamed'; readonly figure: FigureId; readonly count: number };

/** Las figuras que suenan, en orden, de lo escrito. */
export function notationFigures(notation: Notation): FigureId[] {
  return notation.kind === 'figures'
    ? [...notation.figures]
    : Array.from({ length: notation.count }, () => notation.figure);
}

/** Un trozo de un enunciado: texto, o una figura dibujada en línea ("la mitad de 𝅗𝅥"). */
export type PromptPart = string | { readonly figure: FigureId };

export interface LessonOption {
  readonly id: string;
  /** Texto de la opción; en una opción que es una figura, su nombre (para el lector de pantalla). */
  readonly label: string;
  /** Nota que suena al tocar la opción (una ficha de nota que se oye). */
  readonly midi?: number;
  /** La opción ES lo escrito: se dibuja en vez del texto. */
  readonly notation?: Notation;
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
  | { readonly kind: 'metronomes'; readonly bpms: readonly number[] }
  /**
   * Figuras escritas en grande. Suenan al tocarlas, salvo que `muted` (hasta
   * corregir): cuando lo que se pregunta es justo cómo suenan.
   */
  | { readonly kind: 'notation'; readonly notation: Notation; readonly muted: boolean }
  /**
   * Dos notas seguidas: la primera es una figura conocida (la referencia) y la
   * segunda, la que hay que adivinar de oído. Sin referencia no se puede: una
   * figura no dura un tiempo fijo.
   */
  | { readonly kind: 'reference'; readonly known: FigureId; readonly hidden: FigureId };

interface ExerciseBase {
  /** Posición dentro de la plantilla del módulo (desde 1). */
  readonly position: number;
  /** El enunciado en texto (es también lo que lee el lector de pantalla). */
  readonly prompt: string;
  /** El enunciado con figuras dibujadas en línea, si las lleva. */
  readonly promptParts?: readonly PromptPart[];
  /** Corrección breve de una frase, que se muestra al fallar. */
  readonly explanation: string;
}

/** Elegir una respuesta escrita. */
export interface ChoiceExercise extends ExerciseBase {
  readonly mechanic: 'choice';
  readonly stimulus: Stimulus | null;
  readonly options: readonly LessonOption[];
  readonly answer: string;
  /**
   * Las opciones con figuras suenan al tocarlas, salvo en las preguntas de
   * oído: ahí elegir comparando sonidos resolvería el ejercicio sin leerlas, y
   * suenan recién al corregir.
   */
  readonly mutedOptions?: boolean;
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

/**
 * Qué más pide la barra, además de llenarse:
 * - `complete`: solo completarla (ya trae figuras puestas).
 * - `count`: llenarla con exactamente `count` figuras.
 * - `mix`: llenarla combinando estas dos figuras (las dos, y solo ellas).
 * - `dictation`: escribir el ritmo que suena (`figures`, en ese orden). La
 *   barra entera es la referencia: como dura una redonda, las proporciones
 *   que se oyen dicen qué figura es cada nota.
 */
export type FillRule =
  | { readonly kind: 'complete' }
  | { readonly kind: 'count'; readonly count: number }
  | { readonly kind: 'mix'; readonly figures: readonly [FigureId, FigureId] }
  | { readonly kind: 'dictation'; readonly figures: readonly FigureId[] };

/**
 * Llenar una barra rítmica con figuras, como en "¡Experimenta un poco!". Vale
 * cualquier forma que cumpla la regla, así que no hay UNA respuesta: se
 * califica con `judgeFilledBar` y `example` es solo una de las correctas.
 */
export interface FillBarExercise extends ExerciseBase {
  readonly mechanic: 'fill-bar';
  /** Duración de la barra, en semicorcheas. */
  readonly capacity: number;
  /** Figuras ya puestas al empezar: no se pueden quitar ni mover. */
  readonly given: readonly FigureId[];
  /** Las figuras que se pueden poner (no se acaban). */
  readonly palette: readonly FigureId[];
  readonly rule: FillRule;
  /** Una forma correcta de llenarla, la que se muestra al fallar. */
  readonly example: readonly FigureId[];
}

export type LessonExercise =
  | ChoiceExercise
  | FillBarExercise
  | ClipChoiceExercise
  | TempoChoiceExercise
  | SequenceExercise
  | TapExercise
  | PickExercise;

/** Lo que respondió el usuario, según la mecánica. */
export type LessonAnswer =
  | { readonly kind: 'option'; readonly id: string }
  | { readonly kind: 'sequence'; readonly ids: readonly string[] }
  /** Las opciones marcadas, sin orden. */
  | { readonly kind: 'set'; readonly ids: readonly string[] }
  /** El tap ya se calificó al terminar (`judgeTapsOnPulse`); aquí llega su veredicto. */
  | { readonly kind: 'tap'; readonly passed: boolean }
  /** La barra llena: todas sus figuras en orden, las que ya traía incluidas. */
  | { readonly kind: 'bar'; readonly figures: readonly FigureId[] };

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
    case 'fill-bar':
      return answer.kind === 'bar' && judgeFilledBar(exercise, answer.figures);
  }
}

/**
 * ¿La barra quedó bien llena? Sus figuras suman justo su duración, empiezan
 * por las que ya traía, lo añadido sale de la paleta y se cumple la regla.
 */
export function judgeFilledBar(exercise: FillBarExercise, figures: readonly FigureId[]): boolean {
  const total = figures.reduce((sum, id) => sum + figureById(id).units, 0);
  if (total !== exercise.capacity) return false;
  const added = [...figures];
  for (const id of exercise.given) {
    const at = added.indexOf(id);
    if (at < 0) return false;
    added.splice(at, 1);
  }
  if (!added.every((id) => exercise.palette.includes(id))) return false;
  const { rule } = exercise;
  switch (rule.kind) {
    case 'complete':
      return true;
    case 'count':
      return figures.length === rule.count;
    case 'mix':
      return (
        figures.every((id) => rule.figures.includes(id)) &&
        rule.figures.every((id) => figures.includes(id))
      );
    case 'dictation':
      return (
        figures.length === rule.figures.length &&
        figures.every((id, index) => id === rule.figures[index])
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
