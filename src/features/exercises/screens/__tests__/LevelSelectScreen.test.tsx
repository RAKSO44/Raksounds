import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { LevelSelectScreen } from '../LevelSelectScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: { mode?: string } = { mode: 'interval' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, dismissAll: jest.fn() }),
  useLocalSearchParams: () => mockParams,
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

const renderScreen = () => render(<LevelSelectScreen />, { wrapper: Providers });

beforeEach(() => {
  mockParams = { mode: 'interval' };
  mockPush.mockClear();
  mockBack.mockClear();
});

describe('LevelSelectScreen', () => {
  it('muestra los siete niveles con lo que añade cada uno', async () => {
    await renderScreen();

    expect(screen.getByText('NIVEL 1')).toBeOnTheScreen();
    expect(screen.getByText('NIVEL 7')).toBeOnTheScreen();
    // El primero enumera sus intervalos; los siguientes son incrementales.
    expect(screen.getByText('8ªJ y 5ªJ')).toBeOnTheScreen();
    expect(screen.getByText('+ 4ªJ')).toBeOnTheScreen();
    expect(screen.getByText('+ 3ªM y 3ªm')).toBeOnTheScreen();
  });

  it('el título es el del modo elegido', async () => {
    await renderScreen();

    expect(screen.getByText('Identificación de intervalo')).toBeOnTheScreen();
  });

  it('sin nivel elegido, confirmar no hace nada', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('Confirmar'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('al elegir un nivel, confirmar empieza la ronda con ese modo y nivel', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('NIVEL 4'));
    await user.press(screen.getByText('Confirmar'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/round',
      params: { mode: 'interval', level: '4' },
    });
  });

  it('un modo desconocido en la ruta cae en el mixto', async () => {
    mockParams = { mode: 'inventado' };
    await renderScreen();

    expect(screen.getByText('Mixto')).toBeOnTheScreen();
  });

  it('la flecha de la cabecera vuelve atrás', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Volver'));

    expect(mockBack).toHaveBeenCalled();
  });
});
