import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

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

// Providers de app (tema + safe area) que la pantalla necesita para renderizar.
function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

const renderScreen = () => render(<LibraryScreen />, { wrapper: Providers });

beforeEach(() => {
  mockPlayNote.mockClear();
});

describe('LibraryScreen', () => {
  it('muestra por defecto la escala de C mayor', async () => {
    // Desde RNTL v14, render es asíncrono
    await renderScreen();

    expect(screen.getByText('Librería')).toBeOnTheScreen();
    for (const note of ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });

  it('al tocar un grado suena su altura MIDI', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('E4'));

    expect(mockPlayNote).toHaveBeenCalledWith(64);
  });

  it('cambiar la nota base recalcula la escala con el deletreo correcto', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('E♭'));

    // E♭ mayor: bemoles, no sostenidos
    for (const note of ['E♭4', 'F4', 'G4', 'A♭4', 'B♭4', 'C5', 'D5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });

  it('elegir Menor → Arpegio muestra el arpegio menor de 4 grados', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('Menor'));
    await user.press(screen.getByText('Arpegio'));

    for (const note of ['C4', 'E♭4', 'G4', 'C5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
    // La octava repetida del arpegio suena una octava arriba
    await user.press(screen.getByText('C5'));
    expect(mockPlayNote).toHaveBeenCalledWith(72);
  });

  it('combinación completa: A + Mayor + Arpegio = arpegio mayor de A', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('A'));
    // La familia Mayor ya está activa por defecto; su arpegio es el mayor.
    await user.press(screen.getByText('Arpegio'));

    for (const note of ['A4', 'C♯5', 'E5', 'A5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });
});
