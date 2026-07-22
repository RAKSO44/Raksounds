import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/shared/settings';
import { ThemeProvider } from '@/shared/theme';

import { LibraryScreen } from '../LibraryScreen';

// Se mockea solo la frontera nativa: el flujo UI → dominio → IAudioPlayer es real.
const mockNoteOn = jest.fn<number, [number]>();
const mockNoteOff = jest.fn();
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    noteOff: (handle: number) => mockNoteOff(handle),
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

let nextVoice = 0;
beforeEach(() => {
  // Con la octava visible los labels (C4, E♭4…) son únicos y no chocan con los
  // botones del selector de nota base (C, E♭…). El default real (oculta) se
  // cubre en su propio test.
  useSettingsStore.setState({ showOctave: true });
  nextVoice = 0;
  mockNoteOn.mockReset();
  // Cada nota iniciada devuelve una voz distinta, como el motor real.
  mockNoteOn.mockImplementation(() => {
    nextVoice += 1;
    return nextVoice;
  });
  mockNoteOff.mockClear();
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

  it('por defecto la octava está oculta: las notas no llevan número', async () => {
    useSettingsStore.setState({ showOctave: false });
    await renderScreen();

    expect(screen.queryByText('C4')).not.toBeOnTheScreen();
    // 'C' aparece en el selector de nota base Y como grado de la escala.
    expect(screen.getAllByText('C').length).toBeGreaterThan(1);
    expect(screen.getAllByText('D').length).toBeGreaterThan(1);
  });

  it('al tocar un grado suena su altura MIDI', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('E4'));

    expect(mockNoteOn).toHaveBeenCalledWith(64);
  });

  it('al soltar el grado se libera la MISMA voz que se inició', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('E4'));

    // La voz devuelta por noteOn es la que debe soltarse: si se soltara otra
    // (o la altura MIDI), una tecla apagaría la nota de otra tecla.
    expect(mockNoteOff).toHaveBeenCalledWith(mockNoteOn.mock.results[0].value);
  });

  it('varias teclas suenan a la vez: cada una libera solo su voz', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('C4'));
    await user.press(screen.getByText('G4'));

    const [firstVoice, secondVoice] = mockNoteOn.mock.results.map((r) => r.value);
    expect(firstVoice).not.toBe(secondVoice);
    expect(mockNoteOff.mock.calls).toEqual([[firstVoice], [secondVoice]]);
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
    expect(mockNoteOn).toHaveBeenCalledWith(72);
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
