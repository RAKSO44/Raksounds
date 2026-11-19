import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { useStageSelectionStore } from '../../stageSelection';
import { StagesScreen } from '../StagesScreen';

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
  useLocalSearchParams: () => ({ current: '1' }),
}));

beforeEach(() => {
  mockBack.mockClear();
  useStageSelectionStore.setState({ pending: null, last: 0 });
});

describe('StagesScreen', () => {
  it('lista todas las etapas con la actual resaltada', async () => {
    await render(<StagesScreen />, { wrapper: Providers });
    expect(screen.getByLabelText(/^Ir a la etapa 1: /)).toBeTruthy();
    expect(screen.getByLabelText(/^Ir a la etapa 2: .* \(etapa actual\)$/)).toBeTruthy();
    expect(screen.getByLabelText('Ir a la etapa 3: Notas y distancias')).toBeTruthy();
    expect(screen.getByLabelText('Ir a la etapa 4: Escalas, intervalos y tonalidades')).toBeTruthy();
  });

  it('elegir una etapa la deja pendiente para el Home, la guarda como última y vuelve atrás', async () => {
    const user = userEvent.setup();
    await render(<StagesScreen />, { wrapper: Providers });

    await user.press(screen.getByLabelText('Ir a la etapa 4: Escalas, intervalos y tonalidades'));
    expect(useStageSelectionStore.getState().pending).toBe(3);
    expect(useStageSelectionStore.getState().last).toBe(3);
    expect(mockBack).toHaveBeenCalled();
  });
});
