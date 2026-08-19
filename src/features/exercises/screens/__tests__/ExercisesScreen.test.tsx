import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { ExercisesScreen } from '../ExercisesScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), dismissAll: jest.fn() }),
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
});

describe('ExercisesScreen', () => {
  it('ofrece los tres modos de práctica', async () => {
    await render(<ExercisesScreen />, { wrapper: Providers });

    expect(screen.getByText('Combinado')).toBeOnTheScreen();
    expect(screen.getByText('Identificación de intervalo')).toBeOnTheScreen();
    expect(screen.getByText('Identificación de nota')).toBeOnTheScreen();
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
});
