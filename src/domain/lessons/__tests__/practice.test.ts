import { clipEventTimes, Clip } from '../clip';
import { LessonExercise, stimulusClips } from '../exercise';
import { generatePractice } from '../practice';
import { PRACTICE_LENGTH } from '../progress';
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
    case 'clip-choice': {
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
      expect(exercise.beats).toBeGreaterThanOrEqual(4);
      expect(exercise.guideBeats).toBeGreaterThanOrEqual(exercise.countIn);
      break;
    case 'pick': {
      const ids = exercise.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(exercise.answer.every((id) => ids.includes(id))).toBe(true);
      expect(exercise.answer.length).toBeLessThan(ids.length);
      break;
    }
  }
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

describe.each(['notes', 'pulse'] as const)('práctica del módulo %s', (id) => {
  it('genera exactamente 15 ejercicios en las posiciones 1–15', () => {
    const exercises = generatePractice(id, 42);
    expect(exercises).toHaveLength(PRACTICE_LENGTH);
    expect(exercises?.map((e) => e.position)).toEqual(
      Array.from({ length: PRACTICE_LENGTH }, (_, i) => i + 1),
    );
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

  it('el ejercicio visual no suena: sus clips son destellos', () => {
    const exercise = at(3, 5);
    if (exercise.mechanic !== 'clip-choice') throw new Error();
    expect(exercise.options.every((o) => o.clip.kind === 'flash')).toBe(true);
  });

  it('comparar tempos: la respuesta es el BPM extremo pedido', () => {
    for (const seed of SEEDS) {
      for (const position of [3, 7, 11, 15]) {
        const exercise = at(seed, position);
        if (exercise.mechanic !== 'clip-choice') throw new Error();
        const bpms = exercise.options.map((o) => Number(o.id));
        expect(Number(exercise.answer)).toBe(Math.max(...bpms));
      }
      const slower = at(seed, 4);
      if (slower.mechanic !== 'clip-choice') throw new Error();
      expect(Number(slower.answer)).toBe(Math.min(...slower.options.map((o) => Number(o.id))));
    }
  });

  it('los tres tempos del 15 están separados al menos 25 BPM', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 15);
      if (exercise.mechanic !== 'clip-choice') throw new Error();
      const bpms = exercise.options.map((o) => Number(o.id)).sort((a, b) => a - b);
      expect(bpms[1] - bpms[0]).toBeGreaterThanOrEqual(25);
      expect(bpms[2] - bpms[1]).toBeGreaterThanOrEqual(25);
    }
  });

  it('ordenar tempos: la respuesta va de menor a mayor BPM', () => {
    for (const seed of SEEDS) {
      const exercise = at(seed, 14);
      if (exercise.mechanic !== 'sequence') throw new Error();
      const bpms = exercise.answer.map(Number);
      expect(bpms).toEqual([...bpms].sort((a, b) => a - b));
    }
  });

  it('el último tap ya no tiene guía visual tras la entrada', () => {
    const guided = at(1, 6);
    const unguided = at(1, 13);
    if (guided.mechanic !== 'tap' || unguided.mechanic !== 'tap') throw new Error();
    expect(guided.guideBeats).toBe(guided.countIn + guided.beats);
    expect(unguided.guideBeats).toBe(unguided.countIn);
  });
});
