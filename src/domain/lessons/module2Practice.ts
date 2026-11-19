import { RandomSource } from '../ear-training';
import { Clip } from './clip';
import {
  ChoiceExercise,
  LessonExercise,
  LessonOption,
  TapExercise,
  TempoChoiceExercise,
} from './exercise';
import { pickOne, randomInt, shuffle, shuffleUnordered } from './random';
import { irregularOnsets, regularOnsets } from './tempo';

/**
 * Práctica del Módulo 2 (pulso y tempo). Plantilla fija de 11 posiciones: la
 * lección es corta y cada tipo de ejercicio sale una sola vez (salvo tocar
 * con el pulso, una vez lento y otra más rápido).
 *
 * Los pulsos de las opciones NO se cortan solos: suenan sin fin hasta que el
 * usuario los apaga o cambia a otro.
 */

/** Golpes de cada ejemplo de pulso regular/irregular. */
const REGULARITY_BEATS = 6;
/** Tempo de los ejemplos de regularidad. */
const REGULARITY_BPM = 80;
/** Toques que se califican al tocar con el pulso. */
export const TAPS_PER_EXERCISE = 4;

const OPTION_LETTERS = ['A', 'B', 'C'] as const;

/** BPM "redondo" de un metrónomo: múltiplo de `step` entre `min` y `max`. */
function roundBpm(min: number, max: number, step: number, random: RandomSource): number {
  return randomInt(min / step, max / step, random) * step;
}

/** Pulsos para elegir, barajados y con letra (su BPM no se ve hasta corregir). */
function tempoChoice(
  position: number,
  bpms: readonly number[],
  answer: number,
  prompt: string,
  explanation: string,
  random: RandomSource,
): TempoChoiceExercise {
  return {
    position,
    mechanic: 'tempo-choice',
    prompt,
    explanation,
    options: shuffle(bpms, random).map((bpm, order) => ({
      id: String(bpm),
      label: OPTION_LETTERS[order],
      bpm,
    })),
    answer: String(answer),
  };
}

/** Dos pulsos bien separados (≈ 45–55 BPM) en la zona de `low`. */
function distantPair(lowMin: number, lowMax: number, random: RandomSource): [number, number] {
  const low = roundBpm(lowMin, lowMax, 5, random);
  return [low, low + roundBpm(45, 55, 5, random)];
}

function tap(position: number, bpm: number): TapExercise {
  return {
    position,
    mechanic: 'tap',
    prompt: 'Toca TAP con el pulso',
    explanation: 'Toca justo cuando suena cada golpe, sin saltarte ninguno.',
    bpm,
    taps: TAPS_PER_EXERCISE,
  };
}

function regularityClip(regular: boolean, random: RandomSource): Clip {
  const onsetsMs = regular
    ? regularOnsets(REGULARITY_BPM, REGULARITY_BEATS)
    : irregularOnsets(REGULARITY_BPM, REGULARITY_BEATS, random);
  return { kind: 'pulse', onsetsMs };
}

/** Elección escrita con opciones barajadas. */
function textChoice(
  base: Omit<ChoiceExercise, 'mechanic' | 'options' | 'stimulus'> & {
    stimulus?: ChoiceExercise['stimulus'];
  },
  labels: readonly LessonOption[],
  random: RandomSource,
): ChoiceExercise {
  return { stimulus: null, ...base, mechanic: 'choice', options: shuffle(labels, random) };
}

/**
 * Tres tempos al azar entre `min` y `max`, separados al menos por `gap`.
 * Se eligen en pasos de 5 (los BPM "redondos" de un metrónomo), así que los
 * tres límites deben ser múltiplos de 5.
 */
export function spreadTempos(
  min: number,
  max: number,
  gap: number,
  random: RandomSource,
): number[] {
  const step = 5;
  const lowest = randomInt(min / step, (max - 2 * gap) / step, random) * step;
  const middle = randomInt((lowest + gap) / step, (max - gap) / step, random) * step;
  const highest = randomInt((middle + gap) / step, max / step, random) * step;
  return [lowest, middle, highest];
}

/** "Si el tempo pasa de X a Y BPM…": los números y el sentido cambian en cada intento. */
function tempoChange(position: number, random: RandomSource): ChoiceExercise {
  const from = roundBpm(50, 100, 10, random);
  const to = from + roundBpm(20, 60, 10, random);
  const up = random() < 0.5;
  const [before, after] = up ? [from, to] : [to, from];
  return textChoice(
    {
      position,
      prompt: `Si el tempo pasa de ${before} a ${after} BPM, la música…`,
      explanation: up
        ? 'Más BPM son más pulsos por minuto: va más rápido.'
        : 'Menos BPM son menos pulsos por minuto: va más lento.',
      answer: up ? 'faster' : 'slower',
    },
    [
      { id: 'faster', label: 'Va más rápido' },
      { id: 'slower', label: 'Va más lento' },
      // Distractor a propósito: tempo (velocidad) no es altura (agudo/grave).
      { id: 'pitch', label: up ? 'Suena más agudo' : 'Suena más grave' },
    ],
    random,
  );
}

/** ¿Dos metrónomos van al mismo BPM? Si no, se separan lo bastante para oírse. */
function sameTempo(position: number, random: RandomSource): ChoiceExercise {
  const base = roundBpm(70, 110, 5, random);
  const same = random() < 0.5;
  const shift = roundBpm(20, 30, 5, random) * (random() < 0.5 ? -1 : 1);
  const bpms = same ? [base, base] : [base, base + shift];
  return {
    position,
    mechanic: 'choice',
    prompt: '¿Estos dos metrónomos van al mismo BPM?',
    explanation: same
      ? `Los dos iban a ${base} BPM.`
      : `Uno iba a ${bpms[0]} BPM y el otro a ${bpms[1]}.`,
    stimulus: { kind: 'metronomes', bpms },
    // Sí antes que No: es el orden en que se leen.
    options: [
      { id: 'same', label: 'Sí, al mismo' },
      { id: 'different', label: 'No, a distinto' },
    ],
    answer: same ? 'same' : 'different',
  };
}

export function generateModule2Practice(random: RandomSource): LessonExercise[] {
  // 1 — ¿el pulso es regular?
  const regular = random() < 0.5;
  const p01 = textChoice(
    {
      position: 1,
      prompt: '¿Este pulso es regular?',
      explanation: regular
        ? 'Los golpes estaban a la misma distancia: era regular.'
        : 'Los golpes se adelantaban y se atrasaban: era irregular.',
      stimulus: {
        kind: 'clips',
        clips: [{ name: 'El pulso', clip: regularityClip(regular, random) }],
      },
      answer: regular ? 'regular' : 'irregular',
    },
    [
      { id: 'regular', label: 'Sí, regular' },
      { id: 'irregular', label: 'No, irregular' },
    ],
    random,
  );

  const p02 = tap(2, pickOne([65, 70, 75], random));

  const higher = distantPair(55, 70, random);
  const p03 = tempoChoice(
    3,
    higher,
    higher[1],
    '¿Cuál tiene el BPM más alto?',
    `El de ${higher[1]} BPM: más pulsos por minuto, más rápido.`,
    random,
  );

  const lower = distantPair(60, 75, random);
  const p04 = tempoChoice(
    4,
    lower,
    lower[0],
    '¿Cuál tiene el BPM más bajo?',
    `El de ${lower[0]} BPM: menos pulsos por minuto, más lento.`,
    random,
  );

  const p05 = tap(5, pickOne([95, 100, 105], random));
  const p06 = tempoChange(6, random);

  const p07 = textChoice(
    {
      position: 7,
      prompt: '¿Qué significa BPM?',
      explanation: 'BPM son los pulsos por minuto.',
      answer: 'per-minute',
    },
    [
      { id: 'per-minute', label: 'Pulsos por minuto' },
      pickOne(
        [
          { id: 'per-second', label: 'Pulsos por segundo' },
          { id: 'notes', label: 'Notas por minuto' },
        ],
        random,
      ),
      pickOne(
        [
          { id: 'volume', label: 'Volumen del pulso' },
          { id: 'height', label: 'Altura de las notas' },
        ],
        random,
      ),
    ],
    random,
  );

  const p08 = textChoice(
    {
      position: 8,
      prompt: 'A 60 BPM, ¿cuántos pulsos hay en un segundo?',
      explanation: 'Un minuto tiene 60 segundos: 60 BPM es un pulso por segundo.',
      answer: '1',
    },
    [
      { id: '1', label: '1' },
      { id: '2', label: '2' },
      { id: '60', label: '60' },
    ],
    random,
  );

  const p09 = tempoChoice(
    9,
    [60, 90, 120],
    120,
    '¿Cuál va a 120 BPM?',
    'El de 120 BPM es el más rápido de los tres.',
    random,
  );

  const p10 = sameTempo(10, random);

  // 11 — ordenar tempos de más lento a más rápido.
  const tempos = spreadTempos(50, 140, 20, random);
  const tiles = tempos.map((bpm) => ({ id: String(bpm), label: `${bpm} BPM` }));
  const p11 = {
    position: 11,
    mechanic: 'sequence' as const,
    prompt: 'Ordena de más lento a más rápido',
    explanation: `Menos BPM es más lento: ${tempos.join(' → ')}.`,
    tiles: shuffleUnordered(tiles, random),
    answer: tiles.map((tile) => tile.id),
  };

  return [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11];
}
