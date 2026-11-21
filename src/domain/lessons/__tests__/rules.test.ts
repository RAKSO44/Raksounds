import { RandomSource } from '../../ear-training';
import { figureById } from '../../rhythm';
import { FIGURE_DEMO_BPM, FIGURE_DEMO_MIDI, figureClip } from '../figureTheory';
import { firstSequenceError, isAnswerCorrect } from '../exercise';
import { generatePractice, generateRetry } from '../practice';
import {
  nextNoteIndex,
  NOTE_LETTERS,
  noteLetterAt,
  noteMidi,
  noteNameAt,
  noteRun,
  previousNoteIndex,
  runMidis,
} from '../noteNames';
import {
  completeTheory,
  EMPTY_PROGRESS,
  practicePassScore,
  recordPractice,
  recordRetry,
} from '../progress';
import { seededRandom, shuffleUnordered } from '../random';
import { LESSON_MODULES, moduleById, STAGES } from '../stages';
import { judgeTapsOnPulse, TAP_RULES } from '../tapSync';
import {
  bpmAtFraction,
  bpmFraction,
  BPM_RANGE,
  irregularOnsets,
  isAccent,
  isRegular,
  PULSE_DEMO_BPM,
  metronomeWeightPosition,
  regularOnsets,
  tempoMarking,
} from '../tempo';

describe('nombres de nota', () => {
  it('el ciclo da la vuelta en los dos sentidos', () => {
    expect(noteNameAt(nextNoteIndex(6))).toBe('DO');
    expect(noteNameAt(previousNoteIndex(0))).toBe('SI');
    expect(noteRun(5, 4).map(noteNameAt)).toEqual(['LA', 'SI', 'DO', 'RE']);
    expect(noteRun(1, 3, 'down').map(noteNameAt)).toEqual(['RE', 'DO', 'SI']);
  });

  it('las alturas son las notas naturales y suben de octava al cruzar SI→DO', () => {
    expect(noteMidi(0)).toBe(60);
    expect(noteMidi(6)).toBe(71);
    expect(noteMidi(0, 5)).toBe(72);
    expect(runMidis(5, 4)).toEqual([69, 71, 72, 74]);
    expect(runMidis(0, 3, 'down', 5)).toEqual([72, 71, 69]);
  });
});

describe('tempo', () => {
  it('60 BPM es un pulso por segundo', () => {
    expect(regularOnsets(60, 3)).toEqual([0, 1000, 2000]);
  });

  it('el primer golpe de cada grupo de 4 es el fuerte', () => {
    expect([0, 1, 2, 3, 4, 5, 8].map((index) => isAccent(index))).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it('nombra el tempo por zonas, con los bordes incluidos en la zona que empiezan', () => {
    expect(tempoMarking(40)).toBe('Largo');
    expect(tempoMarking(59)).toBe('Largo');
    expect(tempoMarking(60)).toBe('Adagio');
    expect(tempoMarking(100)).toBe('Andante');
    expect(tempoMarking(108)).toBe('Moderato');
    expect(tempoMarking(125)).toBe('Allegro');
    expect(tempoMarking(167)).toBe('Allegro');
    expect(tempoMarking(168)).toBe('Presto');
    expect(tempoMarking(200)).toBe('Presto');
  });

  it('el slider recorre el rango en BPM enteros y no se sale de él', () => {
    expect(bpmAtFraction(0)).toBe(BPM_RANGE.min);
    expect(bpmAtFraction(1)).toBe(BPM_RANGE.max);
    expect(bpmAtFraction(0.5)).toBe(120);
    expect(bpmAtFraction(-0.3)).toBe(BPM_RANGE.min);
    expect(bpmAtFraction(1.4)).toBe(BPM_RANGE.max);
    expect(bpmAtFraction(bpmFraction(125))).toBe(125);
    expect(bpmFraction(10)).toBe(0);
  });

  it('un pulso irregular nunca suena regular ni cruza dos golpes', () => {
    const random = seededRandom(9);
    for (let i = 0; i < 100; i += 1) {
      const onsets = irregularOnsets(80, 6, random);
      expect(isRegular(onsets)).toBe(false);
      expect(onsets.every((t, j) => j === 0 || t > onsets[j - 1])).toBe(true);
    }
    expect(isRegular(regularOnsets(80, 6))).toBe(true);
  });
});

describe('judgeTapsOnPulse', () => {
  // Pulso a 100 BPM: un golpe cada 600 ms, el primero en t = 1000.
  const BPM = 100;
  const FIRST = 1000;
  const beat = (n: number) => FIRST + n * 600;

  it('cuatro toques en golpes seguidos, empezando cuando sea, aprueban', () => {
    const result = judgeTapsOnPulse(
      FIRST,
      BPM,
      [7, 8, 9, 10].map((n) => beat(n) + 10),
    );
    expect(result.passed).toBe(true);
    expect(result.beats.every((b) => b.grade === 'good')).toBe(true);
  });

  it('descuenta una latencia constante (auriculares) sin castigarla', () => {
    const result = judgeTapsOnPulse(
      FIRST,
      BPM,
      [3, 4, 5, 6].map((n) => beat(n) + 200),
    );
    expect(result.latencyMs).toBe(200);
    expect(result.passed).toBe(true);
  });

  it('no perdona adelantarse de forma constante más allá del margen', () => {
    const result = judgeTapsOnPulse(
      FIRST,
      BPM,
      [3, 4, 5, 6].map((n) => beat(n) - 260),
    );
    expect(result.latencyMs).toBe(TAP_RULES.latency.minMs);
    expect(result.passed).toBe(false);
  });

  it('saltarse golpes no vale: deben ser seguidos', () => {
    const result = judgeTapsOnPulse(FIRST, BPM, [2, 4, 6, 8].map(beat));
    expect(result.passed).toBe(false);
  });

  it('si solo el primer toque se desvió, manda el resto de la secuencia', () => {
    const taps = [beat(5) - 290, beat(6), beat(7) + 20, beat(8) - 10];
    const result = judgeTapsOnPulse(FIRST, BPM, taps);
    expect(result.hits).toBe(3);
    expect(result.beats[0].grade).toBe('miss');
    expect(result.passed).toBe(true);
  });

  it('tocar al doble de velocidad no acierta', () => {
    const taps = [0, 1, 2, 3].map((i) => beat(4) + i * 300);
    expect(judgeTapsOnPulse(FIRST, BPM, taps).passed).toBe(false);
  });

  it('sin toques no aprueba', () => {
    expect(judgeTapsOnPulse(FIRST, BPM, []).passed).toBe(false);
  });
});

describe('isAnswerCorrect', () => {
  const [, , sequence, choice] = generatePractice('notes', 5)!;
  const tap = generatePractice('pulse', 5)![1];

  it('una opción acierta solo si es la respuesta', () => {
    if (choice.mechanic !== 'choice') throw new Error();
    expect(isAnswerCorrect(choice, { kind: 'option', id: choice.answer })).toBe(true);
    const wrong = choice.options.find((o) => o.id !== choice.answer)!;
    expect(isAnswerCorrect(choice, { kind: 'option', id: wrong.id })).toBe(false);
  });

  it('una secuencia acierta completa y en orden', () => {
    if (sequence.mechanic !== 'sequence') throw new Error();
    expect(isAnswerCorrect(sequence, { kind: 'sequence', ids: sequence.answer })).toBe(true);
    expect(isAnswerCorrect(sequence, { kind: 'sequence', ids: sequence.answer.slice(0, -1) })).toBe(
      false,
    );
    expect(
      isAnswerCorrect(sequence, { kind: 'sequence', ids: [...sequence.answer].reverse() }),
    ).toBe(false);
  });

  it('un tap acierta con su veredicto y una respuesta de otra mecánica nunca acierta', () => {
    expect(isAnswerCorrect(tap, { kind: 'tap', passed: true })).toBe(true);
    expect(isAnswerCorrect(tap, { kind: 'tap', passed: false })).toBe(false);
    expect(isAnswerCorrect(tap, { kind: 'option', id: 'x' })).toBe(false);
  });
});

describe('secuencias', () => {
  it('señala la primera posición que rompe el orden', () => {
    expect(firstSequenceError(['a', 'b', 'c'], ['a', 'b', 'c'])).toBeNull();
    expect(firstSequenceError(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(1);
  });

  it('barajar para ordenar nunca devuelve el orden correcto', () => {
    const random: RandomSource = seededRandom(3);
    for (let i = 0; i < 200; i += 1) {
      expect(shuffleUnordered(['a', 'b'], random)).toEqual(['b', 'a']);
    }
  });
});

describe('progreso', () => {
  const at = '2026-11-16T10:00:00.000Z';
  const later = '2026-11-17T10:00:00.000Z';

  it('repasar la teoría conserva la fecha de la primera vez', () => {
    const once = completeTheory(EMPTY_PROGRESS, at);
    expect(completeTheory(once, later).theoryCompletedAt).toBe(at);
  });

  it('un intento peor no quita el completado y guarda mejor y último', () => {
    const passed = recordPractice(EMPTY_PROGRESS, 13, 15, at);
    const worse = recordPractice(passed, 5, 15, later);
    expect(worse).toMatchObject({
      practiceCompleted: true,
      practiceCompletedAt: at,
      bestScore: 13,
      lastScore: 5,
      attempts: 2,
    });
  });

  it('reintentar fallos termina el mismo intento: no suma intentos y puede completar', () => {
    const first = recordPractice(EMPTY_PROGRESS, 10, 15, at);
    const retried = recordRetry(first, 15, 15, later);
    expect(retried).toMatchObject({
      attempts: 1,
      lastScore: 15,
      bestScore: 15,
      practiceCompleted: true,
      practiceCompletedAt: later,
    });
  });

  it('reintentar fallos genera solo esas posiciones, con ejercicios nuevos', () => {
    const retry = generateRetry('notes', 99, [2, 9, 15]);
    expect(retry.map((exercise) => exercise.position)).toEqual([2, 9, 15]);
    expect(retry.map((exercise) => exercise.mechanic)).toEqual(['choice', 'sequence', 'pick']);
  });

  it('11/15 no completa la práctica; 12/15 sí', () => {
    expect(recordPractice(EMPTY_PROGRESS, 11, 15, at).practiceCompleted).toBe(false);
    expect(recordPractice(EMPTY_PROGRESS, 12, 15, at).practiceCompleted).toBe(true);
  });

  it('el corte es un 80 % del largo de cada práctica: 9/11 completa, 8/11 no', () => {
    expect(practicePassScore(11)).toBe(9);
    expect(recordPractice(EMPTY_PROGRESS, 8, 11, at).practiceCompleted).toBe(false);
    expect(recordPractice(EMPTY_PROGRESS, 9, 11, at).practiceCompleted).toBe(true);
  });

  it('repetir la teoría conserva la fecha de la primera vez', () => {
    const first = completeTheory(EMPTY_PROGRESS, at);
    expect(completeTheory(first, '2030-01-01').theoryCompletedAt).toBe(at);
  });
});

describe('etapas de la ruta', () => {
  it('las etapas 1–4 tienen los módulos 1–16, numerados seguidos', () => {
    expect(STAGES.map((stage) => stage.modules.map((module) => module.number))).toEqual([
      [1, 2],
      [3, 4, 5, 6],
      [7, 8, 9],
      [10, 11, 12, 13, 14, 15, 16],
    ]);
  });

  it('solo los módulos 1, 2 y 3 tienen lección, y coinciden con su LessonModule', () => {
    const withLesson = STAGES.flatMap((stage) => stage.modules).filter((m) => m.lessonId);
    expect(withLesson.map((m) => m.lessonId)).toEqual(LESSON_MODULES.map((m) => m.id));
    for (const pathModule of withLesson) {
      const lesson = moduleById(pathModule.lessonId ?? undefined);
      expect(lesson?.number).toBe(pathModule.number);
      expect(lesson?.title).toBe(pathModule.title);
    }
  });

  it('todo módulo tiene temas para su tarjeta', () => {
    for (const module of STAGES.flatMap((stage) => stage.modules)) {
      expect(module.topics.length).toBeGreaterThan(0);
    }
  });
});

describe('cifrado', () => {
  it('cada nombre tiene su letra, y da la vuelta como los nombres', () => {
    expect(NOTE_LETTERS).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(noteLetterAt(7)).toBe('C');
    expect(noteLetterAt(-1)).toBe('B');
  });
});

describe('pesa del metrónomo', () => {
  it('arriba a 40 BPM, junto al eje a 208 y más baja cuanto más rápido', () => {
    expect(metronomeWeightPosition(40)).toBe(0);
    expect(metronomeWeightPosition(208)).toBe(1);
    expect(metronomeWeightPosition(120)).toBeGreaterThan(metronomeWeightPosition(60));
    expect(metronomeWeightPosition(20)).toBe(0);
    expect(metronomeWeightPosition(300)).toBe(1);
  });
});

describe('sonido de las figuras (Módulo 3)', () => {
  it('cada figura suena una sola nota que dura su parte del pulso', () => {
    const quarter = figureClip(figureById('quarter'));
    const half = figureClip(figureById('half'));
    if (quarter.kind !== 'notes' || half.kind !== 'notes') throw new Error('clip de notas');
    expect(quarter.notes).toEqual([{ midi: FIGURE_DEMO_MIDI, atMs: 0, durationMs: 750 }]);
    expect(half.notes[0].durationMs).toBe(quarter.notes[0].durationMs * 2);
    expect(FIGURE_DEMO_BPM).toBe(PULSE_DEMO_BPM);
  });
});
