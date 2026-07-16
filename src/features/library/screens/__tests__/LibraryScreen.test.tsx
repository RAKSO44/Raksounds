import { render, screen, userEvent } from '@testing-library/react-native';

import { LibraryScreen } from '../LibraryScreen';

// Se mockea solo la frontera nativa: el flujo UI → dominio → IAudioPlayer es real.
const mockPlayNote = jest.fn();
jest.mock('@/infrastructure/audio/ExpoAudioPlayer', () => ({
  createExpoAudioPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    playNote: (midi: number) => mockPlayNote(midi),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => {
  mockPlayNote.mockClear();
});

describe('LibraryScreen', () => {
  it('muestra por defecto la escala de C mayor', async () => {
    // Desde RNTL v14, render es asíncrono
    await render(<LibraryScreen />);

    expect(screen.getByText('Librería')).toBeOnTheScreen();
    for (const note of ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });

  it('al tocar un grado suena su altura MIDI', async () => {
    const user = userEvent.setup();
    await render(<LibraryScreen />);

    await user.press(screen.getByText('E4'));

    expect(mockPlayNote).toHaveBeenCalledWith(64);
  });

  it('cambiar la nota base recalcula la escala con el deletreo correcto', async () => {
    const user = userEvent.setup();
    await render(<LibraryScreen />);

    await user.press(screen.getByText('E♭'));

    // E♭ mayor: bemoles, no sostenidos
    for (const note of ['E♭4', 'F4', 'G4', 'A♭4', 'B♭4', 'C5', 'D5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });

  it('cambiar el tipo a arpegio muestra 4 grados', async () => {
    const user = userEvent.setup();
    await render(<LibraryScreen />);

    await user.press(screen.getByText('Arpegio menor'));

    for (const note of ['C4', 'E♭4', 'G4', 'C5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
    // La octava repetida del arpegio suena una octava arriba
    await user.press(screen.getByText('C5'));
    expect(mockPlayNote).toHaveBeenCalledWith(72);
  });

  it('combinación completa: arpegio mayor de A', async () => {
    const user = userEvent.setup();
    await render(<LibraryScreen />);

    await user.press(screen.getByText('A'));
    await user.press(screen.getByText('Arpegio mayor'));

    for (const note of ['A4', 'C♯5', 'E5', 'A5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });
});
