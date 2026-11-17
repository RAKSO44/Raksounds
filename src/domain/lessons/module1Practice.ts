import { RandomSource } from '../ear-training';
import { melodyClip } from './clip';
import { ChoiceExercise, ClipChoiceExercise, LessonExercise, SequenceExercise } from './exercise';
import {
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

/** Fichas barajadas de un tramo; los ids son posiciones para admitir repetidos. */
function runSequence(
  position: number,
  prompt: string,
  run: readonly NoteIndex[],
  explanation: string,
  random: RandomSource,
): SequenceExercise {
  const tiles = run.map((index, order) => ({ id: `t${order}`, label: noteNameAt(index) }));
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
  // 01 — nombre de la ficha marcada en la escalera.
  const marked = randomInt(1, NOTE_COUNT - 1, random);
  const p01 = nameChoice(
    {
      position: 1,
      prompt: '¿Cómo se llama la ficha marcada?',
      explanation: `Contando desde DO, la ficha ${marked + 1} es ${noteNameAt(marked)}.`,
      stimulus: { kind: 'steps', highlight: marked, clip: null },
    },
    marked,
    random,
  );

  // 02 — la misma escalera, ahora guiada por el oído: suena y se ilumina.
  const heard = freshIndex(1, NOTE_COUNT - 1, marked, random);
  const p02 = nameChoice(
    {
      position: 2,
      prompt: 'Escucha: ¿qué ficha sonó?',
      explanation: `Sonó la ficha ${heard + 1}: ${noteNameAt(heard)}.`,
      stimulus: { kind: 'steps', highlight: heard, clip: noteClip(heard) },
    },
    heard,
    random,
  );

  // 03 — ordenar tres consecutivas, sin dar la vuelta al ciclo.
  const run3 = noteRun(randomInt(0, NOTE_COUNT - 3, random), 3);
  const p03 = runSequence(
    3,
    'Ordena las notas subiendo, como DO · RE · MI',
    run3,
    `Subiendo, el orden es ${runLabel(run3)}.`,
    random,
  );

  // 04 — ¿qué va después? (DO–LA: sin el salto SI→DO, que llega en la 7).
  const afterOf = randomInt(0, NOTE_COUNT - 2, random);
  const p04 = nameChoice(
    {
      position: 4,
      prompt: `¿Qué nota va después de ${noteNameAt(afterOf)}?`,
      explanation: `Después de ${noteNameAt(afterOf)} viene ${noteNameAt(afterOf + 1)}.`,
      stimulus: { kind: 'row', cells: [noteNameAt(afterOf), null] },
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
      stimulus: { kind: 'row', cells: [null, noteNameAt(beforeOf)] },
    },
    beforeOf - 1,
    random,
  );

  // 06 — secuencia de 4 con un hueco.
  const run4 = noteRun(randomInt(0, NOTE_COUNT - 4, random), 4);
  const gap = randomInt(1, 3, random);
  const p06 = nameChoice(
    {
      position: 6,
      prompt: 'Completa la secuencia',
      explanation: `La secuencia es ${runLabel(run4)}.`,
      stimulus: {
        kind: 'row',
        cells: run4.map((index, order) => (order === gap ? null : noteNameAt(index))),
      },
    },
    run4[gap],
    random,
  );

  // 07 — el ciclo hacia arriba: después de SI vuelve DO.
  const si = NOTE_COUNT - 1;
  const p07 = nameChoice(
    {
      position: 7,
      prompt: '¿Qué nota va después de SI?',
      explanation: 'Después de SI vuelve DO: los nombres se repiten en ciclo.',
      stimulus: { kind: 'row', cells: ['LA', 'SI', null] },
    },
    nextNoteIndex(si),
    random,
  );

  // 08 — el ciclo hacia abajo: antes de DO va SI.
  const p08 = nameChoice(
    {
      position: 8,
      prompt: '¿Qué nota va antes de DO?',
      explanation: 'Bajando desde DO se llega a SI: el ciclo también va hacia atrás.',
      stimulus: { kind: 'row', cells: [null, 'DO', 'RE'] },
    },
    previousNoteIndex(0),
    random,
  );

  // 09 — ordenar cuatro bajando, sin dar la vuelta.
  const down4 = noteRun(randomInt(3, NOTE_COUNT - 1, random), 4, 'down');
  const p09 = runSequence(
    9,
    'Ordena las notas bajando, como MI · RE · DO',
    down4,
    `Bajando, el orden es ${runLabel(down4)}.`,
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
      stimulus: {
        kind: 'row',
        cells: cross.map((index, order) => (order === doAt ? null : noteNameAt(index))),
      },
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

  // 14 — ordenar seis desde una nota, pudiendo cruzar SI→DO.
  const start14 = randomInt(1, NOTE_COUNT - 1, random);
  const run6 = noteRun(start14, 6);
  const p14 = runSequence(
    14,
    `Ordena 6 notas subiendo, empezando en ${noteNameAt(start14)}`,
    run6,
    `Desde ${noteNameAt(start14)}: ${runLabel(run6)}.`,
    random,
  );

  // 15 — de dos parejas, ¿cuál es una octava?
  const p15 = octavePairQuestion(random);

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
    explanation:
      target === 'higher'
        ? `Los dos son ${name}; el agudo suena más arriba.`
        : `Los dos son ${name}; el grave suena más abajo.`,
    options,
    answer: target === 'higher' ? 'high' : 'low',
  };
}

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
      ? `Eran ${noteNameAt(index)} y ${noteNameAt(index)}: el mismo nombre en otra altura.`
      : `Eran ${noteNameAt(index)} y ${noteNameAt(other)}: dos notas distintas.`,
    stimulus: { kind: 'clips', clips: [{ label: 'Escuchar', clip: melodyClip(midis) }] },
    options: [
      { id: 'same', label: 'Sí, el mismo' },
      { id: 'different', label: 'No, distintas' },
    ],
    answer: same ? 'same' : 'different',
  };
}

function octavePairQuestion(random: RandomSource): ClipChoiceExercise {
  const index = randomInt(0, NOTE_COUNT - 1, random);
  const other = wrapIndex(index + randomInt(2, 5, random));
  const name = noteNameAt(index);
  const pairs = shuffle(
    [
      {
        id: 'octave',
        midis: [noteMidi(index, 4), noteMidi(index, 5)],
        reveal: `${name} · ${name}`,
      },
      {
        id: 'different',
        midis: [noteMidi(index, 4), noteMidi(other, 4)],
        reveal: `${name} · ${noteNameAt(other)}`,
      },
    ],
    random,
  );
  return {
    position: 15,
    mechanic: 'clip-choice',
    prompt: '¿En qué pareja suena el mismo nombre en dos alturas?',
    explanation: `La octava era ${name} grave y ${name} agudo.`,
    options: pairs.map((pair, order) => ({
      id: pair.id,
      label: order === 0 ? 'Pareja A' : 'Pareja B',
      clip: melodyClip(pair.midis),
      reveal: pair.reveal,
    })),
    answer: 'octave',
  };
}

/** Alturas de una vuelta completa DO→DO (ascendente o descendente), para la teoría. */
export function octaveRunMidis(direction: 'up' | 'down'): number[] {
  return direction === 'up'
    ? runMidis(0, NOTE_COUNT + 1, 'up')
    : runMidis(0, NOTE_COUNT + 1, 'down', 5);
}
