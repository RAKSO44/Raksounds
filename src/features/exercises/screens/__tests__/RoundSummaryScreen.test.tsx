import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RoundSummary } from '@/domain/ear-training';
import { ThemeProvider } from '@/shared/theme';

import { encodeRoundSummary } from '../../summaryParams';
import { RoundSummaryScreen } from '../RoundSummaryScreen';

const mockDismissAll = jest.fn();
let mockParams: { mode?: string; summary?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissAll: mockDismissAll }),
  useLocalSearchParams: () => mockParams,
}));

const SUMMARY: RoundSummary = {
  total: 10,
  correctCount: 8,
  accuracy: 0.8,
  averageMs: 2400,
  averageReplays: 2.6,
  missedIntervals: ['M3', 'TT'],
  fastestInterval: 'P5',
  fastestMs: 900,
};

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

const renderScreen = () => render(<RoundSummaryScreen />, { wrapper: Providers });

beforeEach(() => {
  mockParams = { mode: 'interval', summary: encodeRoundSummary(SUMMARY) };
  mockDismissAll.mockClear();
});

describe('RoundSummaryScreen', () => {
  it('resume la ronda con el porcentaje y las dos medidas por pregunta', async () => {
    await renderScreen();

    expect(screen.getByText('80%')).toBeOnTheScreen();
    expect(screen.getByText('8 de 10 correctas')).toBeOnTheScreen();
    expect(screen.getByText('2.4 s')).toBeOnTheScreen();
    expect(screen.getByText('por pregunta')).toBeOnTheScreen();
    // Las repeticiones se redondean a un entero: 2.6 se lee como "3".
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('repeticiones por pregunta')).toBeOnTheScreen();
  });

  it('nombra el acierto más rápido y los intervalos por repasar', async () => {
    await renderScreen();

    expect(screen.getByText('5ªJ')).toBeOnTheScreen();
    expect(screen.getByText('en 0.9 s')).toBeOnTheScreen();
    expect(screen.getByText('3ªM')).toBeOnTheScreen();
    expect(screen.getByText('4ªaum/5ªdism')).toBeOnTheScreen();
  });

  it('continuar cierra el resultado y vuelve al menú de Ejercicios', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('Continuar'));

    expect(mockDismissAll).toHaveBeenCalled();
  });

  it('sin un resumen válido en la ruta no rompe: solo no pinta nada', async () => {
    mockParams = { mode: 'interval', summary: 'no-es-json' };
    await renderScreen();

    expect(screen.getByText('Continuar')).toBeOnTheScreen();
    expect(screen.queryByText('por pregunta')).not.toBeOnTheScreen();
  });
});
