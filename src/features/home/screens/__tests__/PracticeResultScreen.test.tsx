import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { PracticeResultScreen } from '../PracticeResultScreen';

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

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

beforeEach(() => mockReplace.mockClear());

const renderScreen = (params: Record<string, string>) => {
  mockParams = params;
  return render(<PracticeResultScreen />, { wrapper: Providers });
};

describe('PracticeResultScreen', () => {
  it('con fallos ofrece reintentarlos: solo esas posiciones, sumando a lo que ya tenía', async () => {
    const user = userEvent.setup();
    await renderScreen({ module: 'notes', score: '12', failed: '2,9,15' });

    expect(screen.getByText('12/15')).toBeTruthy();
    expect(screen.queryByLabelText('Volver a practicar')).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Reintentar fallos' }));

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/lesson/practice',
      params: { module: 'notes', retry: '2,9,15', base: '12' },
    });
  });

  it('sin fallos no hay nada que reintentar', async () => {
    await renderScreen({ module: 'notes', score: '15', failed: '' });
    expect(screen.queryByRole('button', { name: 'Reintentar fallos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('al volver del reintento suma lo recuperado: +3 y sube de 12 a 15', async () => {
    jest.useFakeTimers();
    try {
      await renderScreen({ module: 'notes', score: '15', gained: '3', failed: '' });
      expect(screen.getByText('+3')).toBeTruthy();
      expect(screen.getByText('12/15')).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText('15/15')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
