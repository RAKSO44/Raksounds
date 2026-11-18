import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';

import { generatePractice, LessonExercise, PickExercise, SequenceExercise } from '@/domain/lessons';
import { ThemeProvider } from '@/shared/theme';

import { ClipPlayer } from '../../../hooks/useClipPlayer';
import { LessonExerciseView } from '../LessonExerciseView';

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

  it('¿cuál es más agudo?: sin luz ni pista; basta con tocar las dos', async () => {
    const user = userEvent.setup();
    const exercise = at(11);
    if (exercise.mechanic !== 'clip-choice') throw new Error();
    const { onAnswer } = await show(exercise);
    expect(screen.queryByText(/Puedes volver a escucharlas/)).toBeNull();

    await user.press(screen.getByLabelText('Opción A'));
    expect(onAnswer).not.toHaveBeenCalled();
    await user.press(screen.getByLabelText('Opción B'));
    expect(onAnswer).toHaveBeenLastCalledWith({ kind: 'option', id: exercise.options[1].id });
    expect(player.playNote).toHaveBeenCalledTimes(2);
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
