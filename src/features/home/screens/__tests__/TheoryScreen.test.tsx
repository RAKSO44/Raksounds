import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { useLessonProgressStore } from '../../progressStore';
import { TheoryScreen } from '../TheoryScreen';

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 720 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

const mockBack = jest.fn();
let mockParams: { module?: string } = { module: 'notes' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const mockNoteOn = jest.fn<number, [number]>(() => 1);
const mockPlayTimed = jest.fn<number, [number, number, number]>(() => 1);
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    playTimed: (midi: number, delayMs: number, durationMs: number) =>
      mockPlayTimed(midi, delayMs, durationMs),
    noteOff: jest.fn(),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockBack.mockClear();
  mockNoteOn.mockClear();
  mockPlayTimed.mockClear();
  mockParams = { module: 'notes' };
  useLessonProgressStore.setState({ modules: {} });
});

afterEach(() => {
  jest.useRealTimers();
});

const renderScreen = () => render(<TheoryScreen />, { wrapper: Providers });
const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('TheoryScreen (Módulo 1)', () => {
  it('se recorre sin hacer nada obligatorio y el check da la teoría por leída', async () => {
    const user = setupUser();
    await renderScreen();

    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    expect(screen.queryByLabelText('Página anterior')).toBeNull();
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByText('¿Qué orden siguen?')).toBeTruthy();
    await user.press(screen.getByLabelText('Página anterior'));
    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    await user.press(screen.getByLabelText('Página siguiente'));
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByLabelText('Página 3 de 3')).toBeTruthy();
    expect(useLessonProgressStore.getState().modules.notes).toBeUndefined();
    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.notes?.theoryCompleted).toBe(true);
    expect(mockBack).toHaveBeenCalled();
  });

  it('la tabla hace sonar cada nota y explica sus columnas', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    await user.press(screen.getByLabelText('Escuchar SOL'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockNoteOn).toHaveBeenCalledWith(67);

    await user.press(screen.getByLabelText('¿Qué es cifrado?'));
    expect(screen.getByText(/sistema universal de nombramiento/)).toBeTruthy();
    // Volver a tocar el título la cierra.
    await user.press(screen.getByLabelText('¿Qué es cifrado?'));
    expect(screen.queryByText(/sistema universal de nombramiento/)).toBeNull();
  });

  it('las teclas de la página 2 suenan y "octava" se define al tocarla', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    await user.press(screen.getAllByLabelText('?')[0]);
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockNoteOn).toHaveBeenCalledWith(72);

    await user.press(screen.getByText('octava'));
    expect(screen.getByText(/entre dos notas con el mismo nombre/)).toBeTruthy();
  });

  it('nunca tiene más de 3 páginas', async () => {
    for (const [module, total] of [
      ['notes', 3],
      ['pulse', 2],
      ['figures', 3],
    ] as const) {
      mockParams = { module };
      const { unmount } = await renderScreen();
      expect(screen.getByLabelText(`Página 1 de ${total}`)).toBeTruthy();
      await unmount();
    }
  });
});

describe('TheoryScreen (Módulo 2)', () => {
  const { metronome } = jest.requireMock<{
    metronome: { loop: jest.Mock; stop: jest.Mock };
  }>('@/infrastructure/audio/metronome');

  beforeEach(() => {
    mockParams = { module: 'pulse' };
    metronome.loop.mockClear();
  });

  it('el corazón arranca y detiene un pulso continuo con acentos', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(screen.getByText('¿Qué es el pulso?')).toBeTruthy();
    await user.press(screen.getByLabelText('Escuchar el pulso'));
    expect(metronome.loop).toHaveBeenCalledTimes(1);
    const { bpm, isAccent } = metronome.loop.mock.calls[0][0];
    expect(bpm).toBe(80);
    expect([0, 1, 4].map(isAccent)).toEqual([true, false, true]);

    const handle = metronome.loop.mock.results[0].value;
    await user.press(screen.getByLabelText('Detener el pulso'));
    expect(handle.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Escuchar el pulso')).toBeTruthy();
  });

  it('"constante" se define al tocarla', async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByText('constante'));
    expect(screen.getByText('Siempre la misma velocidad')).toBeTruthy();
  });

  it('la hoja 2 cambia el tempo con la barra, en vivo, y nombra su indicación', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByText('¿Qué es el tempo?')).toBeTruthy();
    expect(screen.getByText('BPM: 100')).toBeTruthy();
    expect(screen.getByText('Andante')).toBeTruthy();

    await user.press(screen.getByLabelText('Escuchar el pulso'));
    const handle = metronome.loop.mock.results[0].value;

    const slider = screen.getByLabelText('Tempo');
    for (let i = 0; i < 8; i += 1) {
      await act(() =>
        slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }),
      );
    }
    expect(screen.getByText('BPM: 108')).toBeTruthy();
    expect(screen.getByText('Moderato')).toBeTruthy();
    expect(handle.setBpm).toHaveBeenLastCalledWith(108);

    await user.press(screen.getByText('Moderato'));
    expect(screen.getByText('Indicaciones de tempo. Se usan en partituras')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: 'tempo' }));
    expect(screen.getByText('Velocidad que tiene el pulso')).toBeTruthy();

    // El check de la última hoja da la teoría por leída.
    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.pulse?.theoryCompleted).toBe(true);
  });
});

describe('TheoryScreen (Módulo 3)', () => {
  beforeEach(() => {
    mockParams = { module: 'figures' };
  });

  const placed = (name: string) =>
    screen.queryAllByLabelText(`${name}. Mantenla presionada para quitarla`);

  it('la hoja 1 compara dos figuras que suenan al tocarlas y revela la referencia', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    expect(screen.getByLabelText('4 manzanas')).toBeTruthy();
    await user.press(screen.getByLabelText('Escuchar blanca'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    // La blanca suena justo lo que vale: dos pulsos a 80 BPM, ni un ms más.
    expect(mockPlayTimed).toHaveBeenCalledWith(60, 0, 1500);

    await user.press(screen.getByText('duración de los sonidos'));
    expect(screen.getByText('Tiempo que permanece sonando una nota')).toBeTruthy();

    // La respuesta a "¿respecto a qué cuentan?" se revela con el corazón.
    expect(screen.queryByText(/^¡Exacto!/)).toBeNull();
    await user.press(screen.getByLabelText('Ver la respuesta'));
    expect(screen.getByText(/^¡Exacto!/)).toBeTruthy();
  });

  it('la hoja 2 selecciona una figura para ver su detalle y "referencia" lleva al pulso', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    for (const name of ['Redonda', 'Blanca', 'Negra', 'Corchea', 'Semicorchea']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    for (const value of ['1 unidad', '1/2 unidad', '1/4 unidad', '1/8 unidad', '1/16 unidad']) {
      expect(screen.getByText(value)).toBeTruthy();
    }
    expect(screen.getByText('Selecciona una figura musical para ver su detalle')).toBeTruthy();

    // En la tabla las figuras no suenan: se seleccionan.
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Ver corchea'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockPlayTimed).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Ver corchea').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.queryByText('Selecciona una figura musical para ver su detalle')).toBeNull();
    expect(screen.getByLabelText('2 corcheas unidas')).toBeTruthy();

    await user.press(screen.getByLabelText('Ver semicorchea'));
    expect(screen.getByLabelText('2 semicorcheas unidas')).toBeTruthy();
    expect(screen.queryByLabelText('2 corcheas unidas')).toBeNull();

    // Tocar otra vez la elegida la deselecciona y vuelve el mensaje.
    await user.press(screen.getByLabelText('Ver semicorchea'));
    expect(screen.getByText('Selecciona una figura musical para ver su detalle')).toBeTruthy();

    await user.press(screen.getByRole('button', { name: 'referencia' }));
    expect(screen.getByText(/¡Esa referencia es el pulso!/)).toBeTruthy();
  });

  it('la barra se llena con figuras, no deja sobrepasarla y se vacía manteniéndolas', async () => {
    const user = setupUser();
    await renderScreen();
    await user.press(screen.getByLabelText('Página siguiente'));
    await user.press(screen.getByLabelText('Página siguiente'));
    expect(screen.getByText('¡Experimenta un poco!')).toBeTruthy();
    expect(screen.getByText('Mantén presionadas')).toBeTruthy();

    // Tocar una figura de abajo la pone al final; no se acaban.
    await user.press(screen.getByLabelText('Blanca. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Negra. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Negra. Toca para ponerla en la barra'));
    expect(placed('Blanca')).toHaveLength(1);
    expect(placed('Negra')).toHaveLength(2);

    // Ya está llena: nada más cabe.
    await user.press(screen.getByLabelText('Semicorchea. Toca para ponerla en la barra'));
    expect(placed('Semicorchea')).toHaveLength(0);

    // Quitar una negra deja sitio para dos corcheas, y la tercera ya no entra.
    await act(() =>
      placed('Negra')[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } }),
    );
    expect(placed('Negra')).toHaveLength(1);
    for (let i = 0; i < 3; i += 1) {
      await user.press(screen.getByLabelText('Corchea. Toca para ponerla en la barra'));
    }
    expect(placed('Corchea')).toHaveLength(2);

    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.figures?.theoryCompleted).toBe(true);
  });
});
