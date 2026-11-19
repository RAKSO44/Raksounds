import { RandomSource } from '../ear-training';
import { melodyClip } from './clip';
import {
  ChoiceExercise,
  ClipChoiceExercise,
  LessonExercise,
  PickExercise,
  RowCell,
  SequenceExercise,
} from './exercise';
import {
  BASE_OCTAVE,
  NOTE_COUNT,
  NoteIndex,
  nextNoteIndex,
  noteClip,
  noteMidi,
  noteNameAt,
  noteRun,
  previousNoteIndex,
  runMidis,
  wrapIndex,
} from './noteNames';
import { pickOne, randomInt, shuffle, shuffleUnordered } from './random';

/**
 * Práctica del Módulo 1 (las notas musicales). Plantilla fija de 15 posiciones
 * sobre el MISMO concepto, con variación controlada:
 *
 * - 1–5 guiadas: nombre de una posición, orden corto, siguiente/anterior.
 * - 6–10 aplicación: huecos, descendente y el salto del ciclo SI→DO.
 * - 11–15 consolidación: la octava (mismo nombre, otra altura) de oído.
 *
 * Toda nota que se ve se puede tocar y suena (salvo la que hay que adivinar,
 * hasta corregir): el nombre siempre va unido a su sonido.
 */

/**
 * Tres opciones de nombre: la correcta y dos vecinas en el ciclo. Las vecinas
 * son los errores plausibles (contar una de más o de menos); nombres al azar
 * serían demasiado fáciles de descartar.
 */
function nameOptions(answer: NoteIndex, random: RandomSource) {
  const neighbours = shuffle(
    [answer - 1, answer + 1, answer + 2, answer - 2].map(wrapIndex),
    random,
  );
  const distractors = [...new Set(neighbours)].filter((index) => index !== answer).slice(0, 2);
  return shuffle([answer, ...distractors], random).map((index) => ({
    id: noteNameAt(index),
    label: noteNameAt(index),
  }));
}

function nameChoice(
  base: Omit<ChoiceExercise, 'mechanic' | 'options' | 'answer'>,
  answer: NoteIndex,
  random: RandomSource,
): ChoiceExercise {
  return {
    ...base,
    mechanic: 'choice',
    options: nameOptions(answer, random),
    answer: noteNameAt(answer),
  };
}

/** Alturas de la escala DO4…SI4, una por barra. */
const STEP_MIDIS = Array.from({ length: NOTE_COUNT }, (_, index) => noteMidi(index));

/** Opciones de nombre que además suenan (cada una en su altura de la escala). */
function soundingNameOptions(answer: NoteIndex, random: RandomSource) {
  return nameOptions(answer, random).map((option) => ({
    ...option,
    midi: STEP_MIDIS[STEP_MIDIS.findIndex((_, index) => noteNameAt(index) === option.id)],
  }));
}

/**
 * Fila de `length` notas seguidas desde `start`, con el hueco en `gap`. Las
 * alturas SUBEN de verdad: tras SI, el DO es el de la octava siguiente.
 */
function rowCells(start: NoteIndex, length: number, gap: number): RowCell[] {
  return runMidis(start, length, 'up', BASE_OCTAVE).map((midi, order) => ({
    label: order === gap ? null : noteNameAt(start + order),
    midi,
  }));
}

/**
 * Fichas barajadas de un tramo que sube o baja de verdad; los ids son
 * posiciones para admitir repetidos.
 */
function runSequence(
  position: number,
  prompt: string,
  start: NoteIndex,
  length: number,
  direction: 'up' | 'down',
  explanation: string,
  random: RandomSource,
): SequenceExercise {
  const run = noteRun(start, length, direction);
  const midis = runMidis(start, length, direction);
  const tiles = run.map((index, order) => ({
    id: `t${order}`,
    label: noteNameAt(index),
    midi: midis[order],
  }));
  return {
    position,
    mechanic: 'sequence',
    prompt,
    explanation,
    tiles: shuffleUnordered(tiles, random),
    answer: tiles.map((tile) => tile.id),
  };
}

function runLabel(run: readonly NoteIndex[]): string {
  return run.map(noteNameAt).join(' · ');
}

/** Índice al azar distinto de `avoid` (no repetir el ejemplo anterior). */
function freshIndex(min: number, max: number, avoid: number, random: RandomSource): number {
  for (;;) {
    const index = randomInt(min, max, random);
    if (index !== avoid || min === max) return index;
  }
}

export function generateModule1Practice(random: RandomSource): LessonExercise[] {
  // 01 — nombre de la nota marcada en la escala. Las opciones suenan.
  const marked = randomInt(1, NOTE_COUNT - 1, random);
  const p01: ChoiceExercise = {
    position: 1,
    mechanic: 'choice',
    prompt: '¿Cómo se llama la nota marcada?',
    explanation: `Contando desde DO, la nota ${marked + 1} es ${noteNameAt(marked)}.`,
    stimulus: { kind: 'steps', highlight: marked, midis: STEP_MIDIS, listen: null },
    options: soundingNameOptions(marked, random),
    answer: noteNameAt(marked),
  };

  // 02 — la misma escala, ahora de oído: suena una nota y hay que ubicarla.
  const heard = freshIndex(1, NOTE_COUNT - 1, marked, random);
  const p02 = nameChoice(
    {
      position: 2,
      prompt: '¿Qué nota sonó?',
      explanation: `Sonó la nota ${heard + 1}: ${noteNameAt(heard)}.`,
      stimulus: { kind: 'steps', highlight: heard, midis: STEP_MIDIS, listen: noteClip(heard) },
    },
    heard,
    random,
  );

  // 03 — ordenar tres consecutivas, sin dar la vuelta al ciclo.
  const start3 = randomInt(0, NOTE_COUNT - 3, random);
  const p03 = runSequence(
    3,
    'Ordena las notas de forma ascendente',
    start3,
    3,
    'up',
    `Subiendo, el orden es ${runLabel(noteRun(start3, 3))}.`,
    random,
  );

  // 04 — ¿qué va después? (DO–LA: sin el salto SI→DO, que llega en la 7).
  const afterOf = randomInt(0, NOTE_COUNT - 2, random);
  const p04 = nameChoice(
    {
      position: 4,
      prompt: `¿Qué nota va después de ${noteNameAt(afterOf)}?`,
      explanation: `Después de ${noteNameAt(afterOf)} viene ${noteNameAt(afterOf + 1)}.`,
      stimulus: { kind: 'row', cells: rowCells(afterOf, 2, 1) },
    },
    afterOf + 1,
    random,
  );

  // 05 — ¿qué va antes? (RE–SI).
  const beforeOf = freshIndex(1, NOTE_COUNT - 1, afterOf + 1, random);
  const p05 = nameChoice(
    {
      position: 5,
      prompt: `¿Qué nota va antes de ${noteNameAt(beforeOf)}?`,
      explanation: `Antes de ${noteNameAt(beforeOf)} va ${noteNameAt(beforeOf - 1)}.`,
      stimulus: { kind: 'row', cells: rowCells(beforeOf - 1, 2, 0) },
    },
    beforeOf - 1,
    random,
  );

  // 06 — secuencia de 4 con un hueco.
  const start4 = randomInt(0, NOTE_COUNT - 4, random);
  const run4 = noteRun(start4, 4);
  const gap = randomInt(1, 3, random);
  const p06 = nameChoice(
    {
      position: 6,
      prompt: 'Completa la secuencia',
      explanation: `La secuencia es ${runLabel(run4)}.`,
      stimulus: { kind: 'row', cells: rowCells(start4, 4, gap) },
    },
    run4[gap],
    random,
  );

  // 07 — el ciclo hacia arriba: después de SI vuelve DO (LA · SI · ?).
  const la = NOTE_COUNT - 2;
  const si = NOTE_COUNT - 1;
  const p07 = nameChoice(
    {
      position: 7,
      prompt: '¿Qué nota va después de SI?',
      explanation: 'Después de SI vuelve DO: los nombres se repiten en ciclo.',
      stimulus: { kind: 'row', cells: rowCells(la, 3, 2) },
    },
    nextNoteIndex(si),
    random,
  );

  // 08 — el ciclo hacia abajo: antes de DO va SI (? · DO · RE).
  const p08 = nameChoice(
    {
      position: 8,
      prompt: '¿Qué nota va antes de DO?',
      explanation: 'Bajando desde DO se llega a SI: el ciclo también va hacia atrás.',
      stimulus: { kind: 'row', cells: rowCells(si, 3, 0) },
    },
    previousNoteIndex(0),
    random,
  );

  // 09 — ordenar cuatro bajando, sin dar la vuelta.
  const startDown = randomInt(3, NOTE_COUNT - 1, random);
  const p09 = runSequence(
    9,
    'Ordena las notas de forma descendente',
    startDown,
    4,
    'down',
    `Bajando, el orden es ${runLabel(noteRun(startDown, 4, 'down'))}.`,
    random,
  );

  // 10 — completar una secuencia que cruza SI→DO (el hueco es el DO).
  const crossStart = pickOne([4, 5, 6], random);
  const cross = noteRun(crossStart, 4);
  const doAt = cross.indexOf(0);
  const p10 = nameChoice(
    {
      position: 10,
      prompt: 'Completa la secuencia',
      explanation: `Tras SI el ciclo vuelve a DO: ${runLabel(cross)}.`,
      stimulus: { kind: 'row', cells: rowCells(crossStart, 4, doAt) },
    },
    0,
    random,
  );

  // 11 — dos DO en registros distintos: ¿cuál es el agudo?
  const lowDo = pickOne([4, 5], random);
  const p11 = octaveCompare(11, 0, lowDo, 'higher', random);

  // 12 — la misma nota en dos registros: ¿cuál es el grave?
  const p12 = octaveCompare(12, randomInt(0, 2, random), 4, 'lower', random);

  // 13 — ¿las dos notas se llaman igual?
  const p13 = sameNameQuestion(random);

  // 14 — ordenar seis desde una nota, pudiendo cruzar SI→DO. Hay que decir
  // desde dónde: al cruzar el ciclo, cualquier nota podría ser la primera.
  const start14 = randomInt(1, NOTE_COUNT - 1, random);
  const p14 = runSequence(
    14,
    `Ordena las notas de forma ascendente, empezando en ${noteNameAt(start14)}`,
    start14,
    6,
    'up',
    `Desde ${noteNameAt(start14)}: ${runLabel(noteRun(start14, 6))}.`,
    random,
  );

  // 15 — de tres sonidos, ¿cuáles dos comparten nombre?
  const p15 = sameNamePickQuestion(random);

  return [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15];
}

/** Dos sonidos del mismo nombre a una octava; hay que elegir el agudo o el grave. */
function octaveCompare(
  position: number,
  index: NoteIndex,
  lowOctave: number,
  target: 'higher' | 'lower',
  random: RandomSource,
): ClipChoiceExercise {
  const name = noteNameAt(index);
  const sounds = shuffle(
    [
      { register: 'low', clip: noteClip(index, lowOctave), reveal: `${name} grave` },
      { register: 'high', clip: noteClip(index, lowOctave + 1), reveal: `${name} agudo` },
    ],
    random,
  );
  const options = sounds.map((sound, order) => ({
    id: sound.register,
    label: order === 0 ? 'A' : 'B',
    clip: sound.clip,
    reveal: sound.reveal,
  }));
  return {
    position,
    mechanic: 'clip-choice',
    prompt: target === 'higher' ? `¿Cuál ${name} es más agudo?` : `¿Cuál ${name} es más grave?`,
    explanation: `Los dos son ${name}; pero en octavas diferentes.`,
    options,
    answer: target === 'higher' ? 'high' : 'low',
  };
}

/**
 * Dos botones, una nota cada uno: ¿se llaman igual? Se pueden tocar a la vez
 * (oírlas juntas es otra forma de comparar).
 */
function sameNameQuestion(random: RandomSource): ChoiceExercise {
  const index = randomInt(0, NOTE_COUNT - 1, random);
  const same = random() < 0.5;
  // La diferente se aleja al menos dos nombres: una vecina sería un salto tan
  // pequeño que el ejercicio pasaría a ser de distancias, no de octavas.
  const other = wrapIndex(index + randomInt(2, 5, random));
  const midis = same
    ? [noteMidi(index, 4), noteMidi(index, 5)]
    : [noteMidi(index, 4), noteMidi(other, 4)];
  return {
    position: 13,
    mechanic: 'choice',
    prompt: '¿Las dos notas tienen el mismo nombre?',
    explanation: same
      ? `Eran ${noteNameAt(index)} y ${noteNameAt(index)}: el mismo nombre en diferente octava.`
      : `Eran ${noteNameAt(index)} y ${noteNameAt(other)}: dos notas distintas.`,
    stimulus: {
      kind: 'clips',
      clips: midis.map((midi, order) => ({
        name: order === 0 ? 'Primera nota' : 'Segunda nota',
        clip: melodyClip([midi]),
      })),
    },
    options: [
      { id: 'same', label: 'Sí, el mismo' },
      { id: 'different', label: 'No, distintas' },
    ],
    answer: same ? 'same' : 'different',
  };
}

/**
 * Tres sonidos: dos son la misma nota en octavas distintas y el tercero es
 * otra. Hay que marcar la pareja. El tercero cae en cualquiera de las dos
 * octavas: si no, bastaría con buscar "el que está solo en su registro".
 */
function sameNamePickQuestion(random: RandomSource): PickExercise {
  const index = randomInt(0, NOTE_COUNT - 1, random);
  const other = wrapIndex(index + randomInt(2, 5, random));
  const name = noteNameAt(index);
  const sounds = shuffle(
    [
      { id: 'low', midi: noteMidi(index, 4), reveal: name },
      { id: 'high', midi: noteMidi(index, 5), reveal: name },
      { id: 'other', midi: noteMidi(other, pickOne([4, 5], random)), reveal: noteNameAt(other) },
    ],
    random,
  );
  return {
    position: 15,
    mechanic: 'pick',
    prompt: 'Marca las dos notas que comparten el mismo nombre',
    explanation: `Las dos ${name} comparten nombre en octavas diferentes; la otra era ${noteNameAt(other)}.`,
    options: sounds.map((sound, order) => ({
      id: sound.id,
      label: `Sonido ${order + 1}`,
      clip: melodyClip([sound.midi]),
      reveal: sound.reveal,
    })),
    answer: ['low', 'high'],
  };
}
