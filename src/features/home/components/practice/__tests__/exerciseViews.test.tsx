import { ReactNode } from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { generatePractice, LessonExercise, PickExercise, SequenceExercise } from '@/domain/lessons';
import { figureById, FigureId } from '@/domain/rhythm';
import { ThemeProvider } from '@/shared/theme';

import { ClipPlayer } from '../../../hooks/useClipPlayer';
import { LessonExerciseView } from '../LessonExerciseView';

// La barra de figuras hace sonar sus fichas con su propio reproductor: se
// mockea solo la frontera nativa del piano.
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: jest.fn(() => 1),
    noteOff: jest.fn(),
    playTimed: jest.fn(() => 1),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

const player: ClipPlayer & { playNote: jest.Mock; play: jest.Mock } = {
  ready: true,
  play: jest.fn(() => 0),
  playNote: jest.fn(),
  stop: jest.fn(),
};

const at = (position: number) => generatePractice('notes', 2024)[position - 1];

function sequenceAt(position: number): SequenceExercise {
  const exercise = at(position);
  if (exercise.mechanic !== 'sequence') throw new Error(`${position} no es de ordenar`);
  return exercise;
}

function pickAt(position: number): PickExercise {
  const exercise = at(position);
  if (exercise.mechanic !== 'pick') throw new Error(`${position} no es de marcar`);
  return exercise;
}

async function show(exercise: LessonExercise, revealed = false) {
  const onAnswer = jest.fn();
  const view = await render(
    <LessonExerciseView
      exercise={exercise}
      revealed={revealed}
      player={player}
      onAnswer={onAnswer}
    />,
    { wrapper: Providers },
  );
  return { onAnswer, view };
}

beforeEach(() => {
  player.play.mockClear();
  player.playNote.mockClear();
});

describe('ejercicios del Módulo 1', () => {
  it('ordenar: tocar una ficha suena y la coloca; con todas puestas entrega el orden', async () => {
    const user = userEvent.setup();
    const exercise = sequenceAt(3);
    expect(exercise.prompt).toBe('Ordena las notas de forma ascendente');
    const { onAnswer } = await show(exercise);

    for (const id of exercise.answer) {
      const tile = exercise.tiles.find((t) => t.id === id)!;
      await user.press(screen.getByLabelText(tile.label));
      expect(player.playNote).toHaveBeenLastCalledWith(tile.midi);
    }
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'sequence', ids: exercise.answer });
  });

  it('marcar la pareja: "Comprobar" solo con exactamente dos marcadas', async () => {
    const user = userEvent.setup();
    const exercise = pickAt(15);
    const { onAnswer } = await show(exercise);
    const [a, b, c] = exercise.options;

    await user.press(screen.getByLabelText(a.label));
    expect(player.playNote).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenLastCalledWith(null);
    await user.press(screen.getByLabelText(b.label));
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'set', ids: [a.id, b.id] });
    await user.press(screen.getByLabelText(c.label));
    expect(onAnswer).toHaveBeenLastCalledWith(null);
    // Desmarcar una vuelve a dejar dos.
    await user.press(screen.getByLabelText(a.label));
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'set', ids: [b.id, c.id] });
  });

  it('marcar la pareja: al corregir, cada botón muestra su nota', async () => {
    const exercise = pickAt(15);
    await show(exercise, true);
    for (const option of exercise.options) {
      expect(screen.getByLabelText(`${option.label}: ${option.reveal}`)).toBeTruthy();
    }
  });

  it('¿cuál es más agudo?: basta con elegir una, y pulsarla de nuevo la deselecciona', async () => {
    const user = userEvent.setup();
    const exercise = at(11);
    if (exercise.mechanic !== 'clip-choice') throw new Error();
    const { onAnswer } = await show(exercise);
    expect(screen.queryByText(/Escucha antes de responder/)).toBeNull();

    await user.press(screen.getByLabelText('Opción A'));
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: exercise.options[0].id });
    await user.press(screen.getByLabelText('Opción A'));
    expect(onAnswer).toHaveBeenLastCalledWith(null);
    await user.press(screen.getByLabelText('Opción B'));
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: exercise.options[1].id });
    expect(player.playNote).toHaveBeenCalledTimes(3);
  });

  it('¿mismo nombre?: se puede responder sin haber escuchado', async () => {
    await show(at(13));
    expect(screen.queryByText(/Escucha antes de responder/)).toBeNull();
    expect(screen.getByLabelText('Sí, el mismo')).toBeEnabled();
  });

  it('¿mismo nombre?: dos botones de escuchar, una nota cada uno', async () => {
    const user = userEvent.setup();
    await show(at(13));
    await user.press(screen.getByLabelText('Primera nota: escuchar'));
    await user.press(screen.getByLabelText('Segunda nota: escuchar'));
    expect(player.playNote).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Sí, el mismo')).toBeEnabled();
  });

  it('¿qué nota sonó?: escala sin nombres; la pregunta va debajo con la pista', async () => {
    await show(at(2));
    expect(screen.getByText('Escucha:')).toBeTruthy();
    expect(screen.queryByLabelText('Nota DO')).toBeNull();
    expect(screen.getByText('Tip: presiona las barras para escuchar las notas')).toBeTruthy();
  });

  it('¿qué va después?: las notas de la fila suenan y el hueco no', async () => {
    const user = userEvent.setup();
    const exercise = at(4);
    if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'row') throw new Error();
    const [known] = exercise.stimulus.cells;
    await show(exercise);
    await user.press(screen.getByLabelText(`Nota ${known.label}`));
    expect(player.playNote).toHaveBeenCalledWith(known.midi);
    expect(screen.getByLabelText('Hueco')).toBeTruthy();
  });
});

describe('ejercicios del Módulo 2', () => {
  const { metronome } = jest.requireMock('@/infrastructure/audio/metronome') as {
    metronome: { loop: jest.Mock };
  };
  const pulseAt = (position: number) => generatePractice('pulse', 2024)[position - 1];

  beforeEach(() => metronome.loop.mockClear());

  /** El pulso continuo que se encendió en la llamada `call` (desde 0). */
  const loopOf = (call: number) => ({
    bpm: metronome.loop.mock.calls[call][0].bpm as number,
    stop: metronome.loop.mock.results[call].value.stop as jest.Mock,
  });

  it('tocar con el pulso: el metrónomo arranca solo; con 4 toques se califica y TAP se bloquea', async () => {
    const user = userEvent.setup();
    const exercise = pulseAt(2);
    if (exercise.mechanic !== 'tap') throw new Error();
    const { onAnswer } = await show(exercise);

    await waitFor(() => expect(metronome.loop).toHaveBeenCalledTimes(1));
    expect(loopOf(0).bpm).toBe(exercise.bpm);
    // Sin golpes de entrada que esperar: se toca cuando se quiere.
    expect(screen.getByText(/Empieza cuando quieras/)).toBeTruthy();

    const tap = screen.getByLabelText('Tocar con el pulso');
    for (let i = 0; i < 3; i += 1) await user.press(tap);
    expect(onAnswer).not.toHaveBeenCalled();
    await user.press(tap);
    expect(onAnswer).toHaveBeenCalledWith({ kind: 'tap', passed: expect.any(Boolean) });
    expect(screen.getByLabelText('Tocar con el pulso')).toBeDisabled();
    // El metrónomo nunca se apagó.
    expect(loopOf(0).stop).not.toHaveBeenCalled();
  });

  it('¿BPM más alto?: elegir suena sin fin, otra cambia y repetir la elegida la apaga', async () => {
    const user = userEvent.setup();
    const exercise = pulseAt(3);
    if (exercise.mechanic !== 'tempo-choice') throw new Error();
    expect(exercise.prompt).toBe('¿Cuál tiene el BPM más alto?');
    const { onAnswer } = await show(exercise);
    const [a, b] = exercise.options;

    await waitFor(() => expect(screen.getByLabelText('Opción A')).toBeEnabled());
    await user.press(screen.getByLabelText('Opción A'));
    expect(loopOf(0).bpm).toBe(a.bpm);
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: a.id });

    await user.press(screen.getByLabelText('Opción B'));
    expect(loopOf(1).bpm).toBe(b.bpm);
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: b.id });

    await user.press(screen.getByLabelText('Opción B'));
    expect(loopOf(1).stop).toHaveBeenCalled();
    expect(onAnswer).toHaveBeenLastCalledWith(null);
    // El BPM no se ve hasta corregir.
    expect(screen.queryByText(`${a.bpm} BPM`)).toBeNull();
  });

  it('¿mismo BPM?: dos metrónomos que se encienden y apagan; el BPM sale al corregir', async () => {
    const user = userEvent.setup();
    const exercise = pulseAt(10);
    if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'metronomes') {
      throw new Error();
    }
    const [first, second] = exercise.stimulus.bpms;
    await show(exercise);

    await waitFor(() => expect(screen.getByLabelText('Metrónomo 1: encender')).toBeEnabled());
    await user.press(screen.getByLabelText('Metrónomo 1: encender'));
    expect(loopOf(0).bpm).toBe(first);
    // Encender el segundo apaga el primero (suena uno a la vez).
    await user.press(screen.getByLabelText('Metrónomo 2: encender'));
    expect(loopOf(0).stop).toHaveBeenCalled();
    expect(loopOf(1).bpm).toBe(second);
    await user.press(screen.getByLabelText('Metrónomo 2: apagar'));
    expect(loopOf(1).stop).toHaveBeenCalled();
    expect(screen.getAllByText('?')).toHaveLength(2);
  });

  it('¿mismo BPM?: al corregir, cada placa muestra su BPM', async () => {
    const exercise = pulseAt(10);
    if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'metronomes') {
      throw new Error();
    }
    await show(exercise, true);
    expect(screen.queryAllByText('?')).toHaveLength(0);
    for (const bpm of exercise.stimulus.bpms) {
      expect(screen.getAllByText(String(bpm)).length).toBeGreaterThan(0);
    }
  });
});

describe('ejercicios del Módulo 3', () => {
  const figuresAt = (position: number) => generatePractice('figures', 2024)[position - 1];
  /** Lo que se oye de una figura: una nota que dura justo lo que vale a 80 BPM. */
  const soundOf = (id: FigureId) => ({
    kind: 'rhythm',
    notes: [{ midi: 60, atMs: 0, durationMs: figureById(id).units * 187.5 }],
  });

  it('opciones con figuras: cada una suena lo que dura al tocarla y se elige', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(2);
    if (exercise.mechanic !== 'choice') throw new Error();
    const { onAnswer } = await show(exercise);
    for (const option of exercise.options) {
      await user.press(screen.getByLabelText(option.label));
      expect(player.play).toHaveBeenLastCalledWith(soundOf(option.id as FigureId));
      expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: option.id });
    }
  });

  it('de oído: las opciones no suenan hasta corregir', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(10);
    if (exercise.mechanic !== 'choice') throw new Error();
    const [option] = exercise.options;
    const { onAnswer } = await show(exercise);
    expect(screen.getByLabelText('Segunda nota: la que hay que adivinar')).toBeTruthy();
    await user.press(screen.getByLabelText(option.label));
    expect(player.play).not.toHaveBeenCalled();
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: option.id });
  });

  it('de oído: al corregir aparece la segunda nota y las opciones ya suenan', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(10);
    if (exercise.mechanic !== 'choice') throw new Error();
    const [option] = exercise.options;
    await show(exercise, true);
    expect(screen.queryByLabelText('Segunda nota: la que hay que adivinar')).toBeNull();
    await user.press(screen.getByLabelText(option.label));
    expect(player.play).toHaveBeenLastCalledWith(soundOf(option.id as FigureId));
  });

  it('referencia: "Escucha" hace sonar la negra y la segunda nota, pegadas', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(10);
    if (exercise.mechanic !== 'choice' || exercise.stimulus?.kind !== 'reference') {
      throw new Error();
    }
    await show(exercise);
    await user.press(screen.getByLabelText('Las dos notas: escuchar'));
    const hidden = figureById(exercise.stimulus.hidden).units * 187.5;
    expect(player.play).toHaveBeenLastCalledWith({
      kind: 'rhythm',
      notes: [
        { midi: 60, atMs: 0, durationMs: 750 },
        { midi: 60, atMs: 750, durationMs: hidden },
      ],
    });
  });

  it('equivalencia: la figura grande suena y cada fila de figuras se puede elegir', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(8);
    if (exercise.mechanic !== 'choice') throw new Error();
    const { onAnswer } = await show(exercise);
    expect(screen.getByText('Recuerda que la duración es referencial')).toBeTruthy();
    for (const option of exercise.options) {
      await user.press(screen.getByLabelText(option.label));
      expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: option.id });
    }
  });

  it('completar la barra: con la barra llena entrega todas sus figuras', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(9);
    if (exercise.mechanic !== 'fill-bar') throw new Error();
    const { onAnswer } = await show(exercise);
    expect(onAnswer).toHaveBeenLastCalledWith(null);

    for (const id of exercise.example.slice(exercise.given.length)) {
      await user.press(
        screen.getByLabelText(`${figureById(id).name}. Toca para ponerla en la barra`),
      );
    }
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'bar', figures: exercise.example });
  });

  it('completar la barra: si al corregir no estaba bien, muestra una forma correcta', async () => {
    const exercise = figuresAt(9);
    await show(exercise, true);
    expect(screen.getByText('Una forma correcta:')).toBeTruthy();
    expect(screen.queryByLabelText(/Toca para ponerla en la barra/)).toBeNull();
  });

  it('dictado: el parlante toca el ritmo entero y escribirlo bien lo entrega', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(16);
    if (exercise.mechanic !== 'fill-bar' || exercise.rule.kind !== 'dictation') throw new Error();
    const { figures } = exercise.rule;
    const { onAnswer } = await show(exercise);
    expect(screen.getByLabelText('La barra dura una redonda')).toBeTruthy();
    await user.press(screen.getByLabelText('El ritmo: escuchar'));
    expect(player.play).toHaveBeenLastCalledWith({
      kind: 'rhythm',
      notes: figures.map((id, index) => ({
        midi: 60,
        atMs: figures.slice(0, index).reduce((sum, f) => sum + figureById(f).units * 187.5, 0),
        durationMs: figureById(id).units * 187.5,
      })),
    });
    for (const id of figures) {
      await user.press(
        screen.getByLabelText(`${figureById(id).name}. Toca para ponerla en la barra`),
      );
    }
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'bar', figures });
  });

  it('dictado: al fallar muestra lo que sonó', async () => {
    await show(figuresAt(13), true);
    expect(screen.getByText('Lo que sonó:')).toBeTruthy();
  });

  it('ordenar figuras: cada ficha suena lo que dura y se coloca', async () => {
    const user = userEvent.setup();
    const exercise = figuresAt(17);
    if (exercise.mechanic !== 'sequence') throw new Error();
    const { onAnswer } = await show(exercise);
    for (const id of exercise.answer) {
      await user.press(screen.getByLabelText(figureById(id as FigureId).name));
      expect(player.play).toHaveBeenLastCalledWith(soundOf(id as FigureId));
    }
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'sequence', ids: exercise.answer });
  });
});
