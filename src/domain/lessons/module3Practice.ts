import { RandomSource } from '../ear-training';
import { figureById, FigureId, FIGURES, halfOf, wholeDivisions } from '../rhythm';
import { rhythmClip, PLAYGROUND_BAR_UNITS } from './figureTheory';
import {
  ChoiceExercise,
  FillBarExercise,
  FillRule,
  LessonExercise,
  LessonOption,
  SequenceExercise,
} from './exercise';
import { pickOne, randomInt, shuffle, shuffleUnordered } from './random';

/**
 * Práctica del Módulo 3 (figuras musicales). Plantilla fija de 17 posiciones
 * que va de reconocer a aplicar: nombre ↔ forma, comparar, "la mitad de",
 * valor relativo, equivalencias, llenar la barra, figuras unidas por barras
 * y el oído (elegir cómo se escribe un ritmo y dictados en la barra).
 *
 * Límites de lo enseñado (ver `docs/roadmap/etapa-2/modulo-3.md`): nada de
 * pulsos por figura (se ve en Compases y métrica), silencios ni compases. De
 * oído, una figura sola no se reconoce: siempre hay una referencia (otra
 * figura conocida, o las del mismo ritmo comparadas entre sí).
 */

const ORDER: readonly FigureId[] = FIGURES.map((figure) => figure.id);

/** "blanca" */
const nameOf = (id: FigureId) => figureById(id).name.toLowerCase();
/** "blancas" */
const pluralOf = (id: FigureId) => `${nameOf(id)}s`;
const unitsOf = (id: FigureId) => figureById(id).units;
const totalUnits = (ids: readonly FigureId[]) => ids.reduce((sum, id) => sum + unitsOf(id), 0);

/**
 * Con qué se confunde cada figura a la vista: la que tiene su misma cabeza o
 * los mismos corchetes de más o de menos. Son las opciones que obligan a
 * mirarla de verdad.
 */
const LOOKALIKES: Record<FigureId, readonly [FigureId, FigureId]> = {
  whole: ['half', 'quarter'],
  half: ['whole', 'quarter'],
  quarter: ['half', 'eighth'],
  eighth: ['sixteenth', 'quarter'],
  sixteenth: ['eighth', 'quarter'],
};

/** Lo que identifica a cada figura, para la corrección. */
const LOOKS: Record<FigureId, string> = {
  whole: 'cabeza hueca y sin plica',
  half: 'cabeza hueca con plica',
  quarter: 'cabeza rellena con plica y sin corchetes',
  eighth: 'un corchete',
  sixteenth: 'dos corchetes',
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Una opción que es una figura dibujada (o varias en fila). */
function figuresOption(figures: readonly FigureId[], id = figures.join('-')): LessonOption {
  return {
    id,
    label: capitalize(figures.map(nameOf).join(', ')),
    notation: { kind: 'figures', figures },
  };
}

/** De la que más dura a la que menos. */
const byDuration = (ids: readonly FigureId[]) => [...ids].sort((a, b) => unitsOf(b) - unitsOf(a));

/** "una blanca, 2 negras y una corchea" (en el orden en que aparecen). */
function describeFigures(figures: readonly FigureId[]): string {
  const counts = new Map<FigureId, number>();
  figures.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const parts = [...counts].map(([id, n]) =>
    n === 1 ? `una ${nameOf(id)}` : `${n} ${pluralOf(id)}`,
  );
  return parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Reconocer
// ---------------------------------------------------------------------------

/** 1 y 3: "¿Cómo se llama esta figura?" con la figura en grande. */
function nameTheFigure(
  position: number,
  pool: readonly FigureId[],
  random: RandomSource,
): ChoiceExercise {
  const figure = pickOne(pool, random);
  const options = shuffle([figure, ...LOOKALIKES[figure]], random).map((id) => ({
    id,
    label: figureById(id).name,
  }));
  return {
    position,
    mechanic: 'choice',
    prompt: '¿Cómo se llama esta figura?',
    explanation: `Es la ${nameOf(figure)}: ${LOOKS[figure]}.`,
    stimulus: { kind: 'notation', notation: { kind: 'figures', figures: [figure] }, muted: false },
    options,
    answer: figure,
  };
}

/** 2: "¿Cuál de estas es la negra?" entre figuras dibujadas. */
function findTheFigure(position: number, random: RandomSource): ChoiceExercise {
  const figure = pickOne(ORDER, random);
  return {
    position,
    mechanic: 'choice',
    prompt: `¿Cuál de estas es la ${nameOf(figure)}?`,
    explanation: `La ${nameOf(figure)} tiene ${LOOKS[figure]}.`,
    stimulus: null,
    options: shuffle([figure, ...LOOKALIKES[figure]], random).map((id) => figuresOption([id])),
    answer: figure,
  };
}

// ---------------------------------------------------------------------------
// Comparar y relacionar
// ---------------------------------------------------------------------------

/** Dos figuras distintas, vecinas o a dos pasos en la tabla: [la que dura más, la otra]. */
function comparablePair(random: RandomSource): [FigureId, FigureId] {
  const gap = randomInt(1, 2, random);
  const longer = randomInt(0, ORDER.length - 1 - gap, random);
  return [ORDER[longer], ORDER[longer + gap]];
}

/** Por qué una dura más que la otra, contado con "la mitad de" (lo que enseña la tabla). */
function whyLonger(longer: FigureId, shorter: FigureId): string {
  const middle = halfOf(figureById(longer));
  if (middle !== null && middle.id === shorter) {
    return `La ${nameOf(shorter)} dura la mitad de la ${nameOf(longer)}.`;
  }
  return `La ${nameOf(shorter)} dura la mitad de la ${middle?.name.toLowerCase()}, que a su vez dura la mitad de la ${nameOf(longer)}.`;
}

/** 4: "¿Cuál dura más / menos?" mirando las figuras (y oyéndolas, si se tocan). */
function longerByLook(position: number, random: RandomSource): ChoiceExercise {
  const [longer, shorter] = comparablePair(random);
  const asksLonger = random() < 0.5;
  return {
    position,
    mechanic: 'choice',
    prompt: asksLonger ? '¿Cuál dura más?' : '¿Cuál dura menos?',
    explanation: whyLonger(longer, shorter),
    stimulus: null,
    options: shuffle([longer, shorter], random).map((id) => figuresOption([id])),
    answer: asksLonger ? longer : shorter,
  };
}

/** 5: "¿Qué figura dura la mitad de 𝅗𝅥?" */
function halfOfFigure(position: number, random: RandomSource): ChoiceExercise {
  const figure = pickOne(ORDER.slice(0, -1), random);
  const half = halfOf(figureById(figure));
  if (half === null) throw new Error(`Sin mitad: ${figure}`);
  // La que dura el doble (el error de leer la relación al revés) y la mitad
  // de la mitad (el de saltarse un paso). La redonda no tiene doble y la
  // corchea no tiene mitad de la mitad: ahí entra la siguiente más cercana.
  const index = ORDER.indexOf(half.id);
  const distractors = ORDER.filter((id) => id !== half.id && id !== figure)
    .sort((a, b) => Math.abs(ORDER.indexOf(a) - index) - Math.abs(ORDER.indexOf(b) - index))
    .slice(0, 2);
  return {
    position,
    mechanic: 'choice',
    prompt: `¿Qué figura dura la mitad de la ${nameOf(figure)}?`,
    promptParts: ['¿Qué figura dura la mitad de ', { figure }, '?'],
    explanation: `La ${half.name.toLowerCase()} dura la mitad de la ${nameOf(figure)}.`,
    stimulus: null,
    options: shuffle([half.id, ...distractors], random).map((id) => figuresOption([id])),
    answer: half.id,
  };
}

/** 6 y 17: ordenar figuras por lo que duran. */
function orderByDuration(
  position: number,
  figures: readonly FigureId[],
  descending: boolean,
  random: RandomSource,
): SequenceExercise {
  const answer = descending ? byDuration(figures) : byDuration(figures).reverse();
  return {
    position,
    mechanic: 'sequence',
    prompt: descending
      ? 'Ordena de la que más dura a la que menos'
      : 'Ordena de la que menos dura a la que más',
    explanation: `${descending ? 'De la que más dura a la que menos' : 'De la que menos dura a la que más'}: ${answer.map(nameOf).join(', ')}.`,
    tiles: shuffleUnordered(answer, random).map((id) => figuresOption([id], id)),
    answer,
  };
}

/** Valores relativos que se ofrecen como opción (la redonda es la unidad). */
const RELATIVE_VALUES = [2, 4, 8, 16] as const;

/** 7: "Si 𝅝 vale 1 unidad, ¿cuánto vale ♩?" */
function relativeValue(position: number, random: RandomSource): ChoiceExercise {
  const figure = pickOne(ORDER.slice(1), random);
  const divisions = wholeDivisions(figureById(figure));
  // Tres valores seguidos que incluyan el correcto: todos plausibles.
  const index = RELATIVE_VALUES.indexOf(divisions as (typeof RELATIVE_VALUES)[number]);
  const first = randomInt(
    Math.max(0, index - 2),
    Math.min(index, RELATIVE_VALUES.length - 3),
    random,
  );
  const options = RELATIVE_VALUES.slice(first, first + 3).map((n) => ({
    id: String(n),
    label: `1/${n}`,
  }));
  return {
    position,
    mechanic: 'choice',
    prompt: `Si la redonda vale 1 unidad, ¿cuánto vale la ${nameOf(figure)}?`,
    promptParts: ['Si ', { figure: 'whole' }, ' vale 1 unidad, ¿cuánto vale ', { figure }, '?'],
    explanation: `La ${nameOf(figure)} vale 1/${divisions}: caben ${divisions} en una redonda.`,
    stimulus: null,
    options,
    answer: String(divisions),
  };
}

/**
 * Equivalencias de 4 y 8 (la de 2 ya es "la mitad de", el ejercicio 5). La
 * de 16 no cabe escrita en una opción.
 */
const EQUIVALENT_PAIRS: readonly (readonly [FigureId, FigureId])[] = [
  ['whole', 'quarter'],
  ['half', 'eighth'],
  ['quarter', 'sixteenth'],
  ['whole', 'eighth'],
  ['half', 'sixteenth'],
];

/**
 * Cuántas figuras traen las opciones: todas pares (un número impar se
 * descartaría sin pensar) y la correcta no siempre en el mismo sitio.
 */
const EQUIVALENT_COUNTS: Record<number, readonly number[]> = {
  4: [2, 4, 8],
  8: [4, 6, 8],
};

/** 8: "¿Qué vale lo mismo que esta figura?", con filas de una figura más corta. */
function equivalence(position: number, random: RandomSource): ChoiceExercise {
  const [long, short] = pickOne(EQUIVALENT_PAIRS, random);
  const count = unitsOf(long) / unitsOf(short);
  const row = (n: number) => Array.from({ length: n }, () => short);
  return {
    position,
    mechanic: 'choice',
    prompt: '¿Qué vale lo mismo que esta figura?',
    explanation: `Una ${nameOf(long)} vale lo mismo que ${count} ${pluralOf(short)}.`,
    stimulus: { kind: 'notation', notation: { kind: 'figures', figures: [long] }, muted: false },
    options: EQUIVALENT_COUNTS[count].map((n) => figuresOption(row(n), String(n))),
    answer: String(count),
  };
}

// ---------------------------------------------------------------------------
// Llenar la barra
// ---------------------------------------------------------------------------

/** Las figuras que se pueden poner en una barra de una redonda. */
const BAR_FIGURES: readonly FigureId[] = ORDER.slice(1);

/** Llena `units` con las figuras más largas posibles (una forma correcta de muchas). */
function greedyFill(units: number, allowed: readonly FigureId[]): FigureId[] {
  const figures: FigureId[] = [];
  let left = units;
  for (const id of byDuration(allowed)) {
    while (unitsOf(id) <= left) {
      figures.push(id);
      left -= unitsOf(id);
    }
  }
  return figures;
}

/** Lo que falta no se llena con UNA figura: hay que pensar cómo combinarlas. */
const NEEDS_COMBINING = [5, 6, 7, 9, 10, 11];

/** 9: completar una barra que ya trae algunas figuras. */
function completeBar(position: number, random: RandomSource): FillBarExercise {
  let given: FigureId[] = [];
  do {
    given = Array.from({ length: randomInt(2, 3, random) }, () => pickOne(BAR_FIGURES, random));
  } while (!NEEDS_COMBINING.includes(PLAYGROUND_BAR_UNITS - totalUnits(given)));
  const rest = greedyFill(PLAYGROUND_BAR_UNITS - totalUnits(given), BAR_FIGURES);
  return {
    position,
    mechanic: 'fill-bar',
    prompt: 'Completa la barra',
    explanation: `Las figuras deben sumar una redonda, sin pasarse. Por ejemplo, faltaban ${describeFigures(rest)}.`,
    capacity: PLAYGROUND_BAR_UNITS,
    given,
    palette: ORDER,
    rule: { kind: 'complete' },
    example: [...given, ...rest],
  };
}

/**
 * Una forma de llenar la barra con exactamente `count` figuras: se parte de
 * dos blancas y se divide la más larga en dos mitades hasta tenerlas.
 */
function fillWithCount(count: number): FigureId[] {
  const figures: FigureId[] = ['half', 'half'];
  while (figures.length < count) {
    const [longest] = byDuration(figures);
    const half = halfOf(figureById(longest));
    if (half === null) break;
    figures.splice(figures.indexOf(longest), 1, half.id, half.id);
  }
  return byDuration(figures);
}

/** Cantidades que obligan a combinar (4 negras, 2 blancas u 8 corcheas salen solas). */
const FILL_COUNTS = [3, 5, 6, 7] as const;
/** Parejas para "combinando": las dos caben juntas sin decenas de semicorcheas. */
const FILL_MIXES: readonly (readonly [FigureId, FigureId])[] = [
  ['half', 'quarter'],
  ['half', 'eighth'],
  ['quarter', 'eighth'],
];

/** 14: llenar una barra vacía con una condición. */
function fillWithRule(position: number, random: RandomSource): FillBarExercise {
  let rule: FillRule;
  let example: FigureId[];
  let prompt: string;
  if (random() < 0.5) {
    const count = pickOne(FILL_COUNTS, random);
    rule = { kind: 'count', count };
    example = fillWithCount(count);
    prompt = `Llena la barra usando exactamente ${count} figuras`;
  } else {
    const [longer, shorter] = pickOne(FILL_MIXES, random);
    rule = { kind: 'mix', figures: [longer, shorter] };
    example = [longer, ...greedyFill(PLAYGROUND_BAR_UNITS - unitsOf(longer), [shorter])];
    prompt = `Llena la barra combinando ${pluralOf(longer)} y ${pluralOf(shorter)}`;
  }
  return {
    position,
    mechanic: 'fill-bar',
    prompt,
    explanation: `Hay varias formas de hacerlo. Por ejemplo, con ${describeFigures(example)}.`,
    capacity: PLAYGROUND_BAR_UNITS,
    given: [],
    palette: rule.kind === 'mix' ? rule.figures : ORDER,
    rule,
    example,
  };
}

// ---------------------------------------------------------------------------
// Figuras unidas por barras
// ---------------------------------------------------------------------------

/** 11: "¿Qué figuras son estas?" con corcheas o semicorcheas unidas. */
function beamedFigures(position: number, random: RandomSource): ChoiceExercise {
  const figure = pickOne<FigureId>(['eighth', 'sixteenth'], random);
  const count = figure === 'eighth' ? randomInt(2, 4, random) : pickOne([2, 4], random);
  const other: FigureId = figure === 'eighth' ? 'sixteenth' : 'eighth';
  const row = (id: FigureId) => Array.from({ length: count }, () => id);
  const options = shuffle([row(figure), row(other), row('quarter')], random).map((figures) =>
    figuresOption(figures),
  );
  const bars = figure === 'eighth' ? 'una barra' : 'dos barras';
  return {
    position,
    mechanic: 'choice',
    prompt: '¿Qué figuras son estas?',
    explanation: `Son ${count} ${pluralOf(figure)}: unidas con ${bars} se escriben distinto, pero duran lo mismo.`,
    stimulus: { kind: 'notation', notation: { kind: 'beamed', figure, count }, muted: false },
    options,
    answer: row(figure).join('-'),
    // Si sonaran, bastaría comparar sonidos: hay que leer las barras.
    mutedOptions: true,
  };
}

// ---------------------------------------------------------------------------
// Oído (siempre con referencia)
// ---------------------------------------------------------------------------

const BY_EAR: readonly FigureId[] = ['half', 'quarter', 'eighth', 'sixteenth'];

/** Cómo suena la segunda respecto a la negra, sin hablar de "el doble". */
const AGAINST_QUARTER: Record<FigureId, string> = {
  whole: 'La segunda dura lo mismo que cuatro negras: es una redonda.',
  half: 'La segunda dura lo mismo que dos negras: es una blanca.',
  quarter: 'Las dos duran lo mismo: la segunda también es una negra.',
  eighth: 'La segunda dura la mitad de la negra: es una corchea.',
  sixteenth: 'La segunda dura la mitad de la mitad de la negra: es una semicorchea.',
};

/** 10: la primera es una negra; ¿qué figura es la segunda? */
function againstReference(position: number, random: RandomSource): ChoiceExercise {
  const hidden = pickOne(BY_EAR, random);
  const left = BY_EAR.filter((id) => id !== hidden);
  const options = shuffle([hidden, ...shuffle(left, random).slice(0, 2)], random);
  return {
    position,
    mechanic: 'choice',
    prompt: 'La primera nota es una negra. ¿Qué figura es la segunda?',
    explanation: AGAINST_QUARTER[hidden],
    stimulus: { kind: 'reference', known: 'quarter', hidden },
    options: byDuration(options).map((id) => figuresOption([id])),
    answer: hidden,
    mutedOptions: true,
  };
}

/** Las figuras de los ritmos de oído (sin la redonda: alargaría el ritmo de más). */
const PATTERN_FIGURES: readonly FigureId[] = ['half', 'quarter', 'eighth'];
const PATTERN_FIGURES_SHORT: readonly FigureId[] = ['quarter', 'eighth', 'sixteenth'];

/** Todas las formas distintas de ordenar unas figuras. */
function arrangements(figures: readonly FigureId[]): FigureId[][] {
  if (figures.length <= 1) return [[...figures]];
  const seen = new Set<string>();
  const result: FigureId[][] = [];
  figures.forEach((first, index) => {
    if (seen.has(first)) return;
    seen.add(first);
    const rest = [...figures.slice(0, index), ...figures.slice(index + 1)];
    arrangements(rest).forEach((tail) => result.push([first, ...tail]));
  });
  return result;
}

/**
 * 12 y 15: escuchar un ritmo y elegir cómo se escribe. Las tres opciones
 * tienen LAS MISMAS figuras en distinto orden: solo el oído las distingue.
 * - `short`: una figura y dos de otra (3 formas de ordenarlas).
 * - `long`: dos y dos de figuras más cortas (6 formas; se ofrecen 3).
 */
function patternByEar(
  position: number,
  shape: 'short' | 'long',
  random: RandomSource,
): ChoiceExercise {
  const [a, b] = shuffle(shape === 'short' ? PATTERN_FIGURES : PATTERN_FIGURES_SHORT, random);
  const all = arrangements(shape === 'short' ? [a, b, b] : [a, a, b, b]);
  const patterns = shuffle(all, random).slice(0, 3);
  const answer = pickOne(patterns, random);
  return {
    position,
    mechanic: 'choice',
    prompt: 'Escucha y elige cómo se escribe',
    explanation: `Sonó: ${answer.map(nameOf).join(', ')}.`,
    stimulus: { kind: 'clips', clips: [{ name: 'El ritmo', clip: rhythmClip(answer) }] },
    options: patterns.map((figures) => figuresOption(figures)),
    answer: answer.join('-'),
    mutedOptions: true,
  };
}

/**
 * Trozos con los que se arman los dictados: figuras sueltas o grupos que
 * suman un pulso de negra, para que el ritmo suene natural.
 */
const DICTATION_CELLS: Record<'basic' | 'short', readonly (readonly FigureId[])[]> = {
  basic: [['half'], ['quarter'], ['eighth', 'eighth']],
  short: [['quarter'], ['eighth', 'eighth'], ['sixteenth', 'sixteenth', 'sixteenth', 'sixteenth']],
};

/** Un ritmo que llena la barra justa, con al menos dos figuras distintas. */
function dictationRhythm(cells: readonly (readonly FigureId[])[], random: RandomSource): FigureId[] {
  for (;;) {
    const figures: FigureId[] = [];
    while (totalUnits(figures) < PLAYGROUND_BAR_UNITS) {
      const fitting = cells.filter(
        (cell) => totalUnits(figures) + totalUnits(cell) <= PLAYGROUND_BAR_UNITS,
      );
      figures.push(...pickOne(fitting, random));
    }
    const kinds = new Set(figures).size;
    if (kinds >= 2 && figures.length >= 3 && figures.length <= 8) return figures;
  }
}

/**
 * 13 y 16: escuchar un ritmo y escribirlo en la barra. El primero trae
 * puesta la primera figura (una referencia más); el segundo, la barra vacía:
 * la única referencia es que todo dura una redonda.
 */
function dictation(
  position: number,
  cells: 'basic' | 'short',
  withFirst: boolean,
  random: RandomSource,
): FillBarExercise {
  const figures = dictationRhythm(DICTATION_CELLS[cells], random);
  return {
    position,
    mechanic: 'fill-bar',
    prompt: 'Escucha y escribe el ritmo en la barra',
    explanation: `Sonó: ${figures.map(nameOf).join(', ')}.`,
    capacity: PLAYGROUND_BAR_UNITS,
    given: withFirst ? figures.slice(0, 1) : [],
    palette: BAR_FIGURES,
    rule: { kind: 'dictation', figures },
    example: figures,
  };
}

/** Los 17 ejercicios del Módulo 3, en su orden fijo. */
export function generateModule3Practice(random: RandomSource): LessonExercise[] {
  return [
    nameTheFigure(1, ['whole', 'half', 'quarter'], random),
    findTheFigure(2, random),
    nameTheFigure(3, ['eighth', 'sixteenth'], random),
    longerByLook(4, random),
    halfOfFigure(5, random),
    orderByDuration(6, shuffle(ORDER, random).slice(0, 4), true, random),
    relativeValue(7, random),
    equivalence(8, random),
    completeBar(9, random),
    againstReference(10, random),
    beamedFigures(11, random),
    patternByEar(12, 'short', random),
    dictation(13, 'basic', true, random),
    fillWithRule(14, random),
    patternByEar(15, 'long', random),
    dictation(16, 'short', false, random),
    orderByDuration(17, ORDER, false, random),
  ];
}
