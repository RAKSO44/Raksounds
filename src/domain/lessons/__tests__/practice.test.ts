import { figureById, FigureId, FIGURES } from '../../rhythm';
import { clipEventTimes, Clip } from '../clip';
import {
  FillBarExercise,
  isAnswerCorrect,
  judgeFilledBar,
  LessonExercise,
  notationFigures,
  stimulusClips,
} from '../exercise';
import { TAPS_PER_EXERCISE } from '../module2Practice';
import { generatePractice, hasPractice, practiceLength } from '../practice';
import { isRegular } from '../tempo';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);

/** Banco de muestras del piano: C4–C6. */
const MIN_MIDI = 60;
const MAX_MIDI = 84;

function clipsOf(exercise: LessonExercise): Clip[] {
  const options =
    exercise.mechanic === 'clip-choice' || exercise.mechanic === 'pick'
      ? exercise.options.map((o) => o.clip)
      : [];
  return [...stimulusClips(exercise), ...options];
}

/** Toda altura suelta que un ejercicio hace sonar al tocar algo. */
function midisOf(exercise: LessonExercise): number[] {
  const own: number[] = [];
  if (exercise.mechanic === 'choice' || exercise.mechanic === 'sequence') {
    const items = exercise.mechanic === 'choice' ? exercise.options : exercise.tiles;
    items.forEach((item) => item.midi !== undefined && own.push(item.midi));
  }
  if (exercise.mechanic === 'choice' && exercise.stimulus !== null) {
    const stimulus = exercise.stimulus;
    if (stimulus.kind === 'steps') own.push(...stimulus.midis);
    if (stimulus.kind === 'row') own.push(...stimulus.cells.map((cell) => cell.midi));
  }
  return own;
}

/** Invariantes comunes a cualquier práctica: lo que hace válido un ejercicio. */
function expectValid(exercise: LessonExercise) {
  switch (exercise.mechanic) {
    case 'choice':
    case 'clip-choice':
    case 'tempo-choice': {
      const ids = exercise.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      const labels = exercise.options.map((o) => o.label);
      expect(new Set(labels).size).toBe(labels.length);
      expect(ids).toContain(exercise.answer);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      break;
    }
    case 'sequence': {
      const ids = exercise.tiles.map((t) => t.id);
      expect([...ids].sort()).toEqual([...exercise.answer].sort());
      // Barajadas: nunca vienen ya resueltas.
      expect(ids).not.toEqual(exercise.answer);
      break;
    }
    case 'tap':
      expect(exercise.taps).toBe(TAPS_PER_EXERCISE);
      break;
    case 'pick': {
      const ids = exercise.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(exercise.answer.every((id) => ids.includes(id))).toBe(true);
      expect(exercise.answer.length).toBeLessThan(ids.length);
      break;
    }
    case 'fill-bar':
      // La forma de ejemplo es correcta, y la barra no viene ya llena.
      expect(judgeFilledBar(exercise, exercise.example)).toBe(true);
      expect(isAnswerCorrect(exercise, { kind: 'bar', figures: exercise.example })).toBe(true);
      expect(judgeFilledBar(exercise, exercise.given)).toBe(false);
      break;
  }
  expect(exercise.explanation.length).toBeGreaterThan(0);
  for (const midi of midisOf(exercise)) {
    expect(midi).toBeGreaterThanOrEqual(MIN_MIDI);
    expect(midi).toBeLessThanOrEqual(MAX_MIDI);
  }
  for (const clip of clipsOf(exercise)) {
    if (clip.kind === 'notes') {
      for (const note of clip.notes) {
        expect(note.midi).toBeGreaterThanOrEqual(MIN_MIDI);
        expect(note.midi).toBeLessThanOrEqual(MAX_MIDI);
      }
    }
    const times = clipEventTimes(clip);
    expect(times.every((t, i) => i === 0 || t > times[i - 1])).toBe(true);
  }
}

describe.each([
  ['notes', 15],
  ['pulse', 11],
  ['figures', 17],
] as const)('práctica del módulo %s', (id, length) => {
  it(`genera ${length} ejercicios en las posiciones 1–${length}`, () => {
    const exercises = generatePractice(id, 42);
    expect(practiceLength(id)).toBe(length);
    expect(exercises.map((e) => e.position)).toEqual(Array.from({ length }, (_, i) => i + 1));
  });

  it('la misma semilla da el mismo intento y otra semilla lo varía', () => {
    expect(generatePractice(id, 7)).toEqual(generatePractice(id, 7));
    const variants = new Set(SEEDS.map((seed) => JSON.stringify(generatePractice(id, seed))));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('todos los ejercicios son válidos con cualquier semilla', () => {
    for (const seed of SEEDS) {
      generatePractice(id, seed)?.forEach(expectValid);
    }
  });

  it('cada posición mantiene su mecánica en todos los intentos', () => {
    const reference = generatePractice(id, 1)?.map((e) => e.mechanic);
    for (const seed of SEEDS) {
      expect(generatePractice(id, seed)?.map((e) => e.mechanic)).toEqual(reference);
    }
  });
});

describe('práctica del Módulo 1 (notas)', () => {
  const at = (seed: number, position: number) => generatePractice('notes', seed)![position - 1];

  it('después de SI y antes de DO, siempre DO y SI', () => {
    for (const seed of SEEDS) {
      expect(at(seed, 7)).toMatchObject({ answer: 'DO' });
      expect(at(seed, 8)).toMatchObject({ answer: 'SI' });
      expect(at(seed, 10)).toMatchObject({ answer: 'DO' });
    }
  });

  it('la secuencia que cruza SI→DO tiene el hueco donde va DO', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 10);
      if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'row') throw new Error();
      const cells = exercise.stimulus.cells;
      const gap = cells.findIndex((cell) => cell.label === null);
      if (gap > 0) expect(cells[gap - 1].label).toBe('SI');
      if (gap < cells.length - 1) expect(cells[gap + 1].label).toBe('RE');
      // Tras SI el DO suena más agudo, no siete notas más abajo.
      const midis = cells.map((cell) => cell.midi);
      expect(midis.every((midi, i) => i === 0 || midi > midis[i - 1])).toBe(true);
    }
  });

  it('las notas de las filas, la escala y las fichas suenan en su orden', () => {
    for (const seed of SEEDS) {
      for (const exercise of generatePractice('notes', seed)) {
        if (exercise.mechanic === 'sequence') {
          const byId = new Map(exercise.tiles.map((tile) => [tile.id, tile.midi!]));
          const ordered = exercise.answer.map((id) => byId.get(id)!);
          const up = exercise.position !== 9;
          expect(
            ordered.every((m, i) => i === 0 || (up ? m > ordered[i - 1] : m < ordered[i - 1])),
          ).toBe(true);
        }
        if (exercise.mechanic === 'choice' && exercise.stimulus?.kind === 'row') {
          const midis = exercise.stimulus.cells.map((cell) => cell.midi);
          expect(midis.every((m, i) => i === 0 || m > midis[i - 1])).toBe(true);
        }
      }
    }
  });

  it('las preguntas de "después de" no dan la vuelta al ciclo antes de enseñarlo', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 4);
      expect(exercise).toMatchObject({ mechanic: 'choice' });
      if (exercise.mechanic === 'choice') expect(exercise.answer).not.toBe('DO');
    }
  });

  it('comparar DO grave y agudo: el agudo está una octava exacta por encima', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 11);
      if (exercise.mechanic !== 'clip-choice') throw new Error();
      const midi = (id: string) => {
        const clip = exercise.options.find((o) => o.id === id)!.clip;
        return clip.kind === 'notes' ? clip.notes[0].midi : NaN;
      };
      expect(midi('high') - midi('low')).toBe(12);
      expect(midi('low') % 12).toBe(0);
    }
  });

  it('"¿mismo nombre?" responde "same" solo cuando las dos notas están a una octava', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 13);
      const clips = stimulusClips(exercise);
      if (exercise.mechanic !== 'choice') throw new Error();
      // Dos botones, una nota cada uno: se pueden tocar por separado o a la vez.
      expect(clips).toHaveLength(2);
      const [a, b] = clips.map((clip) => (clip.kind === 'notes' ? clip.notes[0].midi : NaN));
      expect(exercise.answer).toBe((b - a) % 12 === 0 ? 'same' : 'different');
    }
  });

  it('en el 15 hay que marcar justo las dos notas que están a una octava', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 15);
      if (exercise.mechanic !== 'pick') throw new Error();
      expect(exercise.options).toHaveLength(3);
      const midi = (id: string) => {
        const clip = exercise.options.find((o) => o.id === id)!.clip;
        return clip.kind === 'notes' ? clip.notes[0].midi : NaN;
      };
      const [x, y] = exercise.answer;
      expect(Math.abs(midi(x) - midi(y))).toBe(12);
      const odd = exercise.options.find((o) => !exercise.answer.includes(o.id))!;
      expect((midi(odd.id) - midi(x)) % 12).not.toBe(0);
    }
  });
});

describe('práctica del Módulo 2 (pulso)', () => {
  const at = (seed: number, position: number) => generatePractice('pulse', seed)![position - 1];

  it('regular/irregular: la respuesta coincide con el pulso que suena', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 1);
      const [clip] = stimulusClips(exercise);
      if (exercise.mechanic !== 'choice' || clip.kind !== 'pulse') throw new Error();
      expect(exercise.answer).toBe(isRegular(clip.onsetsMs) ? 'regular' : 'irregular');
    }
  });

  it('BPM más alto / más bajo: la respuesta es el extremo pedido y están bien separados', () => {
    for (const seed of SEEDS) {
      const higher = at(seed, 3);
      const lower = at(seed, 4);
      if (higher.mechanic !== 'tempo-choice' || lower.mechanic !== 'tempo-choice') {
        throw new Error();
      }
      const high = higher.options.map((o) => o.bpm);
      const low = lower.options.map((o) => o.bpm);
      expect(Number(higher.answer)).toBe(Math.max(...high));
      expect(Number(lower.answer)).toBe(Math.min(...low));
      expect(Math.max(...high) - Math.min(...high)).toBeGreaterThanOrEqual(45);
      expect(Math.max(...low) - Math.min(...low)).toBeGreaterThanOrEqual(45);
      expect(higher.prompt).toBe('¿Cuál tiene el BPM más alto?');
      expect(lower.prompt).toBe('¿Cuál tiene el BPM más bajo?');
    }
  });

  it('cada tipo de comparación sale una sola vez (no se repite)', () => {
    const prompts = generatePractice('pulse', 5).map((e) => e.prompt);
    expect(prompts.filter((p) => p.includes('más alto'))).toHaveLength(1);
    expect(prompts.filter((p) => p.includes('más bajo'))).toHaveLength(1);
  });

  it('"¿Cuál va a 120 BPM?" tiene la respuesta entre sus opciones', () => {
    const exercise = at(3, 9);
    if (exercise.mechanic !== 'tempo-choice') throw new Error();
    expect(exercise.answer).toBe('120');
    expect(exercise.options.map((o) => o.bpm).sort((a, b) => a - b)).toEqual([60, 90, 120]);
  });

  it('el cambio de tempo varía sus números y su sentido, y la respuesta lo sigue', () => {
    const seen = new Set<string>();
    const answers = new Set<string>();
    for (const seed of SEEDS) {
      const exercise = at(seed, 6);
      if (exercise.mechanic !== 'choice') throw new Error();
      const [before, after] = (exercise.prompt.match(/\d+/g) ?? []).map(Number);
      expect(before).not.toBe(after);
      expect(exercise.answer).toBe(after > before ? 'faster' : 'slower');
      seen.add(`${before}-${after}`);
      answers.add(exercise.answer);
    }
    expect(seen.size).toBeGreaterThan(10);
    expect(answers).toEqual(new Set(['faster', 'slower']));
  });

  it('¿mismo BPM?: dos metrónomos, iguales o separados al menos 20 BPM', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 10);
      if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'metronomes') {
        throw new Error();
      }
      const [a, b] = exercise.stimulus.bpms;
      if (exercise.answer === 'same') expect(a).toBe(b);
      else expect(Math.abs(a - b)).toBeGreaterThanOrEqual(20);
    }
  });

  it('ordenar tempos: la respuesta va de menor a mayor BPM', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 11);
      if (exercise.mechanic !== 'sequence') throw new Error();
      const bpms = exercise.answer.map(Number);
      expect(bpms).toEqual([...bpms].sort((a, b) => a - b));
    }
  });

  it('tocar con el pulso: dos veces, la segunda más rápida', () => {
    const slow = at(1, 2);
    const fast = at(1, 5);
    if (slow.mechanic !== 'tap' || fast.mechanic !== 'tap') throw new Error();
    expect(fast.bpm).toBeGreaterThan(slow.bpm);
  });
});

const unitsOf = (id: string) => figureById(id as FigureId).units;
const sum = (ids: readonly FigureId[]) => ids.reduce((total, id) => total + unitsOf(id), 0);
/** Lo que dura una semicorchea a 80 BPM, en ms. */
const SIXTEENTH_MS = 187.5;

describe('práctica del Módulo 3 (figuras)', () => {
  const at = (seed: number, position: number) => generatePractice('figures', seed)[position - 1];
  const fillAt = (seed: number, position: number): FillBarExercise => {
    const exercise = at(seed, position);
    if (exercise.mechanic !== 'fill-bar') throw new Error(`${position} no es de llenar`);
    return exercise;
  };

  it('todos los módulos ya tienen práctica', () => {
    expect(hasPractice('notes')).toBe(true);
    expect(hasPractice('pulse')).toBe(true);
    expect(hasPractice('figures')).toBe(true);
  });

  it('"¿cómo se llama?": la figura dibujada es la respuesta; el 3 es corchea o semicorchea', () => {
    for (const seed of SEEDS) {
      for (const position of [1, 3]) {
        const exercise = at(seed, position);
        if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'notation') {
          throw new Error();
        }
        expect(exercise.stimulus.notation).toEqual({
          kind: 'figures',
          figures: [exercise.answer],
        });
        if (position === 3) expect(['eighth', 'sixteenth']).toContain(exercise.answer);
      }
    }
  });

  it('"¿cuál dura más / menos?" responde según lo que dura cada una', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 4);
      if (exercise.mechanic !== 'choice') throw new Error();
      const [a, b] = exercise.options.map((option) => option.id);
      const longer = unitsOf(a) > unitsOf(b) ? a : b;
      const shorter = longer === a ? b : a;
      expect(exercise.answer).toBe(exercise.prompt.includes('más') ? longer : shorter);
    }
  });

  it('"la mitad de": la respuesta dura justo la mitad de la figura pedida', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 5);
      if (exercise.mechanic !== 'choice') throw new Error();
      const asked = exercise.promptParts?.find((part) => typeof part !== 'string');
      if (asked === undefined || typeof asked === 'string') throw new Error();
      expect(unitsOf(exercise.answer) * 2).toBe(unitsOf(asked.figure));
      expect(exercise.options).toHaveLength(3);
    }
  });

  it('ordenar: 4 figuras de la que más dura a la que menos; las 5 al revés al final', () => {
    for (const seed of SEEDS) {
      const first = at(seed, 6);
      const last = at(seed, 17);
      if (first.mechanic !== 'sequence' || last.mechanic !== 'sequence') throw new Error();
      const units = first.answer.map(unitsOf);
      expect(units).toHaveLength(4);
      expect(units).toEqual([...units].sort((a, b) => b - a));
      expect(last.answer).toEqual(FIGURES.map((figure) => figure.id).reverse());
    }
  });

  it('valor relativo: 1/n con n las que caben en una redonda, entre tres valores seguidos', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 7);
      if (exercise.mechanic !== 'choice') throw new Error();
      const values = exercise.options.map((option) => Number(option.id));
      expect(values).toHaveLength(3);
      expect(values[1]).toBe(values[0] * 2);
      expect(values[2]).toBe(values[1] * 2);
      const asked = exercise.promptParts?.filter((part) => typeof part !== 'string').at(-1);
      if (asked === undefined || typeof asked === 'string') throw new Error();
      expect(Number(exercise.answer)).toBe(unitsOf('whole') / unitsOf(asked.figure));
      expect(values).toContain(Number(exercise.answer));
    }
  });

  it('equivalencia: varía las figuras, cada opción es una fila par y la correcta suma lo mismo', () => {
    const pairs = new Set<string>();
    for (const seed of SEEDS) {
      const exercise = at(seed, 8);
      if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'notation') {
        throw new Error();
      }
      const [long] = notationFigures(exercise.stimulus.notation);
      const rows = exercise.options.map((option) => {
        if (option.notation === undefined) throw new Error();
        return notationFigures(option.notation);
      });
      pairs.add(`${long}-${rows[0][0]}`);
      for (const row of rows) {
        expect(row.length % 2).toBe(0);
        expect(new Set(row).size).toBe(1);
      }
      const right = rows[exercise.options.findIndex((option) => option.id === exercise.answer)];
      expect(sum(right)).toBe(unitsOf(long));
      expect(rows.filter((row) => sum(row) === unitsOf(long))).toHaveLength(1);
    }
    expect(pairs.size).toBe(5);
  });

  it('completar la barra: lo que falta no se llena con una sola figura', () => {
    for (const seed of SEEDS) {
      const exercise = fillAt(seed, 9);
      const missing = exercise.capacity - sum(exercise.given);
      expect(missing).toBeGreaterThan(0);
      expect(FIGURES.map((figure) => figure.units)).not.toContain(missing);
    }
  });

  it('llenar con regla: alterna "exactamente N" y "combinando"', () => {
    const kinds = new Set<string>();
    for (const seed of SEEDS) {
      const exercise = fillAt(seed, 14);
      kinds.add(exercise.rule.kind);
      expect(exercise.given).toEqual([]);
      if (exercise.rule.kind === 'mix') expect(exercise.palette).toEqual(exercise.rule.figures);
    }
    expect(kinds).toEqual(new Set(['count', 'mix']));
  });

  it('de oído, las opciones no suenan hasta corregir; el patrón es el mismo ritmo reordenado', () => {
    for (const seed of SEEDS) {
      for (const position of [10, 11, 12, 15]) {
        expect(at(seed, position)).toMatchObject({ mechanic: 'choice', mutedOptions: true });
      }
      for (const [position, size] of [
        [12, 3],
        [15, 4],
      ]) {
        const pattern = at(seed, position);
        if (pattern.mechanic !== 'choice' || pattern.stimulus?.kind !== 'clips') throw new Error();
        expect(pattern.options).toHaveLength(3);
        expect(new Set(pattern.options.map((option) => option.id)).size).toBe(3);
        const sorted = pattern.options.map((option) => option.id.split('-').sort().join());
        expect(new Set(sorted).size).toBe(1);
        expect(pattern.answer.split('-')).toHaveLength(size);
        const [{ clip }] = pattern.stimulus.clips;
        if (clip.kind !== 'rhythm') throw new Error();
        expect(clip.notes.map((note) => note.durationMs / SIXTEENTH_MS)).toEqual(
          pattern.answer.split('-').map(unitsOf),
        );
      }
    }
  });

  it('dictados: el ritmo llena la barra; el primero trae su primera figura, el segundo nada', () => {
    for (const seed of SEEDS) {
      for (const position of [13, 16]) {
        const exercise = fillAt(seed, position);
        if (exercise.rule.kind !== 'dictation') throw new Error();
        const { figures } = exercise.rule;
        expect(sum(figures)).toBe(exercise.capacity);
        expect(new Set(figures).size).toBeGreaterThanOrEqual(2);
        expect(exercise.given).toEqual(position === 13 ? figures.slice(0, 1) : []);
        expect(judgeFilledBar(exercise, figures)).toBe(true);
      }
    }
  });
});

describe('calificar una barra llena', () => {
  const exercise = (rule: FillBarExercise['rule'], given: FigureId[] = []): FillBarExercise => ({
    position: 1,
    mechanic: 'fill-bar',
    prompt: '',
    explanation: '',
    capacity: 16,
    given,
    palette: FIGURES.map((figure) => figure.id),
    rule,
    example: [],
  });

  it('vale cualquier forma que sume justo la barra y conserve las que traía', () => {
    const complete = exercise({ kind: 'complete' }, ['half']);
    expect(judgeFilledBar(complete, ['half', 'quarter', 'eighth', 'eighth'])).toBe(true);
    expect(judgeFilledBar(complete, ['eighth', 'half', 'eighth', 'quarter'])).toBe(true);
    expect(judgeFilledBar(complete, ['half', 'quarter'])).toBe(false);
    expect(judgeFilledBar(complete, ['half', 'half', 'eighth'])).toBe(false);
    expect(judgeFilledBar(complete, ['quarter', 'quarter', 'quarter', 'quarter'])).toBe(false);
  });

  it('"exactamente N" cuenta todas las figuras', () => {
    const three = exercise({ kind: 'count', count: 3 });
    expect(judgeFilledBar(three, ['half', 'quarter', 'quarter'])).toBe(true);
    expect(judgeFilledBar(three, ['half', 'half'])).toBe(false);
  });

  it('"combinando" exige las dos figuras y solo ellas', () => {
    const mix = exercise({ kind: 'mix', figures: ['half', 'eighth'] });
    expect(judgeFilledBar(mix, ['half', 'eighth', 'eighth', 'eighth', 'eighth'])).toBe(true);
    expect(judgeFilledBar(mix, ['half', 'half'])).toBe(false);
    expect(judgeFilledBar(mix, ['half', 'quarter', 'quarter'])).toBe(false);
  });

  it('un dictado exige justo esas figuras y en ese orden', () => {
    const dictation = exercise({ kind: 'dictation', figures: ['half', 'quarter', 'eighth', 'eighth'] });
    expect(judgeFilledBar(dictation, ['half', 'quarter', 'eighth', 'eighth'])).toBe(true);
    expect(judgeFilledBar(dictation, ['quarter', 'half', 'eighth', 'eighth'])).toBe(false);
    expect(judgeFilledBar(dictation, ['half', 'quarter', 'quarter'])).toBe(false);
  });
});
