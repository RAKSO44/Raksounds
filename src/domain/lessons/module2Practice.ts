import { RandomSource } from '../ear-training';
import { Clip } from './clip';
import { ChoiceExercise, ClipChoiceExercise, LessonExercise, TapExercise } from './exercise';
import { pickOne, randomInt, shuffle, shuffleUnordered } from './random';
import { irregularOnsets, pulseClip, regularOnsets } from './tempo';

/**
 * Práctica del Módulo 2 (pulso y tempo). Plantilla fija de 15 posiciones:
 *
 * - 1–5 guiadas: pulso regular o no, tocar con guía, rápido/lento muy distintos.
 * - 6–10 aplicación: tocar más golpes, tempos más cercanos, qué es BPM.
 * - 11–15 consolidación: tres tempos, igual/distinto, tocar sin guía visual.
 */

/** Golpes que suena cada opción al comparar tempos. */
const COMPARE_BEATS = 4;
/** Golpes de cada ejemplo de pulso regular/irregular. */
const REGULARITY_BEATS = 6;
/** Tempo de los ejemplos de regularidad. */
const REGULARITY_BPM = 80;
/** Golpes de entrada antes de empezar a tocar. */
const COUNT_IN = 4;

const OPTION_LETTERS = ['A', 'B', 'C'] as const;

/** Opciones sonoras de tempo: cada una suena a su BPM y lo revela al corregir. */
function tempoOptions(bpms: readonly number[], random: RandomSource) {
  return shuffle(bpms, random).map((bpm, order) => ({
    id: String(bpm),
    label: OPTION_LETTERS[order],
    clip: pulseClip(bpm, COMPARE_BEATS),
    reveal: `${bpm} BPM`,
  }));
}

function tempoCompare(
  position: number,
  bpms: readonly number[],
  target: 'faster' | 'slower',
  random: RandomSource,
  prompt?: string,
): ClipChoiceExercise {
  const answer = target === 'faster' ? Math.max(...bpms) : Math.min(...bpms);
  return {
    position,
    mechanic: 'clip-choice',
    prompt: prompt ?? (target === 'faster' ? '¿Cuál va más rápido?' : '¿Cuál va más lento?'),
    explanation:
      target === 'faster'
        ? `El de ${answer} BPM: más pulsos por minuto, más rápido.`
        : `El de ${answer} BPM: menos pulsos por minuto, más lento.`,
    options: tempoOptions(bpms, random),
    answer: String(answer),
  };
}

function tap(position: number, bpm: number, beats: number, guided: boolean): TapExercise {
  return {
    position,
    mechanic: 'tap',
    prompt: guided ? 'Toca TAP con cada pulso' : 'Toca TAP con cada pulso, ahora sin la luz',
    explanation: 'Escucha la entrada y toca justo cuando suena cada golpe.',
    bpm,
    countIn: COUNT_IN,
    beats,
    guideBeats: guided ? COUNT_IN + beats : COUNT_IN,
  };
}

function regularityClip(regular: boolean, random: RandomSource, kind: 'pulse' | 'flash'): Clip {
  const onsetsMs = regular
    ? regularOnsets(REGULARITY_BPM, REGULARITY_BEATS)
    : irregularOnsets(REGULARITY_BPM, REGULARITY_BEATS, random);
  return { kind, onsetsMs };
}

/** Elección escrita con opciones barajadas. */
function textChoice(
  base: Omit<ChoiceExercise, 'mechanic' | 'options' | 'stimulus'> & {
    stimulus?: ChoiceExercise['stimulus'];
  },
  labels: readonly { id: string; label: string }[],
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

export function generateModule2Practice(random: RandomSource): LessonExercise[] {
  // 01 — ¿el pulso es regular?
  const regular01 = random() < 0.5;
  const p01 = textChoice(
    {
      position: 1,
      prompt: '¿Este pulso es regular?',
      explanation: regular01
        ? 'Los golpes estaban a la misma distancia: era regular.'
        : 'Los golpes se adelantaban y se atrasaban: era irregular.',
      stimulus: {
        kind: 'clips',
        clips: [{ label: 'Escuchar', clip: regularityClip(regular01, random, 'pulse') }],
      },
      answer: regular01 ? 'regular' : 'irregular',
    },
    [
      { id: 'regular', label: 'Sí, regular' },
      { id: 'irregular', label: 'No, irregular' },
    ],
    random,
  );

  const p02 = tap(2, pickOne([70, 75, 80, 85, 90], random), 4, true);
  const p03 = tempoCompare(3, [60, 110], 'faster', random);
  const p04 = tempoCompare(4, [65, 120], 'slower', random);

  // 05 — el pulso visto, sin sonido: ¿qué destello es regular?
  const p05: ClipChoiceExercise = {
    position: 5,
    mechanic: 'clip-choice',
    prompt: '¿Qué luz parpadea con un pulso regular?',
    explanation: 'La regular destella siempre a la misma distancia.',
    options: shuffle(
      [
        { id: 'regular', clip: regularityClip(true, random, 'flash'), reveal: 'Regular' },
        { id: 'irregular', clip: regularityClip(false, random, 'flash'), reveal: 'Irregular' },
      ],
      random,
    ).map((option, order) => ({ ...option, label: OPTION_LETTERS[order] })),
    answer: 'regular',
  };

  const p06 = tap(6, pickOne([65, 70, 75, 80, 85, 90, 95], random), 6, true);
  const p07 = tempoCompare(7, [75, 100], 'faster', random);

  const p08 = textChoice(
    {
      position: 8,
      prompt: 'Si el tempo pasa de 60 a 120 BPM, la música…',
      explanation: 'Más BPM son más pulsos por minuto: va más rápido.',
      answer: 'faster',
    },
    [
      { id: 'faster', label: 'Va más rápido' },
      { id: 'slower', label: 'Va más lento' },
      // Distractor a propósito: tempo (velocidad) no es altura (agudo/grave).
      { id: 'higher', label: 'Suena más agudo' },
    ],
    random,
  );

  const p09 = textChoice(
    {
      position: 9,
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

  const p10 = textChoice(
    {
      position: 10,
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

  const p11 = tempoCompare(11, [60, 90, 120], 'faster', random, '¿Cuál va a 120 BPM?');

  // 12 — ¿el segundo tempo es igual o distinto al primero?
  const same12 = random() < 0.5;
  const second12 = same12 ? 90 : 110;
  const p12 = textChoice(
    {
      position: 12,
      prompt: '¿El segundo va al mismo tempo que el primero?',
      explanation: same12
        ? 'Los dos iban a 90 BPM: el mismo tempo.'
        : `El primero iba a 90 BPM y el segundo a ${second12}: distinto tempo.`,
      stimulus: {
        kind: 'clips',
        clips: [
          { label: 'Primero', clip: pulseClip(90, COMPARE_BEATS) },
          { label: 'Segundo', clip: pulseClip(second12, COMPARE_BEATS) },
        ],
      },
      answer: same12 ? 'same' : 'different',
    },
    [
      { id: 'same', label: 'Igual' },
      { id: 'different', label: 'Distinto' },
    ],
    random,
  );

  const p13 = tap(13, pickOne([75, 80, 85, 90, 95, 100, 105], random), 6, false);

  // 14 — ordenar tempos de más lento a más rápido.
  const tempos14 = spreadTempos(50, 140, 20, random);
  const tiles14 = tempos14.map((bpm) => ({ id: String(bpm), label: `${bpm} BPM` }));
  const p14 = {
    position: 14,
    mechanic: 'sequence' as const,
    prompt: 'Ordena de más lento a más rápido',
    explanation: `Menos BPM es más lento: ${tempos14.join(' → ')}.`,
    tiles: shuffleUnordered(tiles14, random),
    answer: tiles14.map((tile) => tile.id),
  };

  const p15 = tempoCompare(15, spreadTempos(55, 135, 25, random), 'faster', random);

  return [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15];
}
