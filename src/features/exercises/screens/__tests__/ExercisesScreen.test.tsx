import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MicrophonePermission } from '@/domain/audio';
import { ThemeProvider } from '@/shared/theme';

import { ExercisesScreen } from '../ExercisesScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), dismissAll: jest.fn() }),
}));

let mockPermission: MicrophonePermission = 'granted';
const mockRequestPermission = jest.fn(() => Promise.resolve(mockPermission));
jest.mock('@/infrastructure/audio/microphone', () => ({
  microphone: {
    requestPermission: () => mockRequestPermission(),
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

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

beforeEach(() => {
  mockPush.mockClear();
  mockRequestPermission.mockClear();
  mockPermission = 'granted';
});

describe('ExercisesScreen', () => {
  it('ofrece los tres modos de práctica', async () => {
    await render(<ExercisesScreen />, { wrapper: Providers });

    expect(screen.getByText('Identificación de intervalo')).toBeOnTheScreen();
    expect(screen.getByText('Identificación de nota')).toBeOnTheScreen();
    // El modo mezclado va en una columna con el nombre letra a letra, así que
    // se busca por su etiqueta accesible y no por el texto pintado.
    expect(screen.getByLabelText('Mixto')).toBeOnTheScreen();
  });

  it('elegir un modo lleva a la selección de nivel con ese modo', async () => {
    const user = userEvent.setup();
    await render(<ExercisesScreen />, { wrapper: Providers });

    await user.press(screen.getByText('Identificación de nota'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/levels',
      params: { mode: 'note' },
    });
  });

  it('el modo mixto lleva a la selección de nivel igual que los sueltos', async () => {
    const user = userEvent.setup();
    await render(<ExercisesScreen />, { wrapper: Providers });

    await user.press(screen.getByLabelText('Mixto'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/levels',
      params: { mode: 'mixed' },
    });
  });

  it('ofrece los dos ejercicios de entonación, que llevan a su selección de nivel', async () => {
    const user = userEvent.setup();
    await render(<ExercisesScreen />, { wrapper: Providers });

    expect(screen.getByText('Ejercicios de entonación')).toBeOnTheScreen();
    await user.press(screen.getByText('Entonación de notas'));

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/levels',
      params: { mode: 'singNote' },
    });
  });

  it('los auditivos no piden el micrófono', async () => {
    const user = userEvent.setup();
    await render(<ExercisesScreen />, { wrapper: Providers });

    await user.press(screen.getByText('Identificación de intervalo'));

    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('sin permiso de micrófono avisa y no deja entrar; al volver a pulsar lo pide de nuevo', async () => {
    mockPermission = 'denied';
    const user = userEvent.setup();
    await render(<ExercisesScreen />, { wrapper: Providers });

    await user.press(screen.getByText('Entonación de intervalos'));

    expect(await screen.findByText('Activa el micrófono')).toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();

    await user.press(screen.getByText('Ahora no'));
    mockPermission = 'granted';
    await user.press(screen.getByText('Entonación de intervalos'));

    expect(mockRequestPermission).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/levels',
      params: { mode: 'singInterval' },
    });
  });
});
