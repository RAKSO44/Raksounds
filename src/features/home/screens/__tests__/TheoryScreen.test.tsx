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
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    noteOff: jest.fn(),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockBack.mockClear();
  mockNoteOn.mockClear();
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
    expect(screen.getByText(/de la A a la G/)).toBeTruthy();
    // Volver a tocar el título la cierra.
    await user.press(screen.getByLabelText('¿Qué es cifrado?'));
    expect(screen.queryByText(/de la A a la G/)).toBeNull();
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
    expect(screen.getByText(/Un intervalo musical/)).toBeTruthy();
  });

  it('nunca tiene más de 3 páginas', async () => {
    for (const module of ['notes', 'pulse']) {
      mockParams = { module };
      const { unmount } = await renderScreen();
      expect(screen.getByLabelText('Página 1 de 3')).toBeTruthy();
      await unmount();
    }
  });
});
