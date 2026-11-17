import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen, userEvent } from '@testing-library/react-native';

import { generatePractice } from '@/domain/lessons';
import { ThemeProvider } from '@/shared/theme';

import { PracticeScreen } from '../PracticeScreen';

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
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ module: 'notes' }),
}));

jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: jest.fn(() => 1),
    noteOff: jest.fn(),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

const { soundEffects: mockSoundEffects } = jest.requireMock<{
  soundEffects: { play: jest.Mock };
}>('@/infrastructure/audio/soundEffects');

/** La semilla del intento sale de `Date.now()`: fijarla hace el intento conocido. */
const SEED = 1234;
const first = generatePractice('notes', SEED)[0];
if (first.mechanic !== 'choice') throw new Error('el ejercicio 1 es de elegir');
const RIGHT = first.answer;
const WRONG = first.options.find((option) => option.id !== RIGHT)!.label;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(SEED);
  mockSoundEffects.play.mockClear();
  mockBack.mockClear();
});

const renderScreen = () => render(<PracticeScreen />, { wrapper: Providers });

describe('PracticeScreen', () => {
  it('"Comprobar" se habilita al elegir y corrige con su efecto', async () => {
    const user = userEvent.setup();
    await renderScreen();

    expect(screen.getByText(first.prompt)).toBeTruthy();
    const check = screen.getByRole('button', { name: 'Comprobar' });
    expect(check).toBeDisabled();

    await user.press(screen.getByLabelText(RIGHT));
    await user.press(screen.getByRole('button', { name: 'Comprobar' }));

    expect(screen.getByText('¡Bien hecho!')).toBeTruthy();
    expect(mockSoundEffects.play).toHaveBeenCalledWith('success');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('al fallar muestra la explicación del concepto', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText(WRONG));
    await user.press(screen.getByRole('button', { name: 'Comprobar' }));

    expect(screen.getByText('No es correcto')).toBeTruthy();
    expect(screen.getByText(first.explanation)).toBeTruthy();
    expect(mockSoundEffects.play).toHaveBeenCalledWith('error');
  });

  it('salir pide confirmación', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText('Volver'));
    expect(screen.getByText('¿Salir de la práctica?')).toBeTruthy();
    await user.press(screen.getByText('Salir'));
    expect(mockBack).toHaveBeenCalled();
  });
});
