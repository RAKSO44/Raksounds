import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SingingSummary } from '@/domain/singing';
import { ThemeProvider } from '@/shared/theme';

import { decodeSingingSummary, encodeSingingSummary } from '../../summaryParams';
import { SingingSummaryScreen } from '../SingingSummaryScreen';

const mockDismissAll = jest.fn();
let mockParams: { kind?: string; summary?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissAll: mockDismissAll }),
  useLocalSearchParams: () => mockParams,
}));

const SUMMARY: SingingSummary = {
  total: 10,
  correctCount: 7,
  accuracy: 0.7,
  averageMs: 5200,
  averageReplays: 1,
  averageCentsOff: 18.4,
  tendencyCents: -14,
  missedTargets: [
    { kind: 'chordTone', fn: 'third' },
    { kind: 'chordTone', fn: 'seventh' },
  ],
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

const renderScreen = () => render(<SingingSummaryScreen />, { wrapper: Providers });

beforeEach(() => {
  mockParams = { kind: 'singNote', summary: encodeSingingSummary(SUMMARY) };
  mockDismissAll.mockClear();
});

describe('SingingSummaryScreen', () => {
  it('resume aciertos, afinación media y tendencia de la voz', async () => {
    await renderScreen();

    expect(screen.getByText('Entonación de notas')).toBeOnTheScreen();
    expect(screen.getByText('70%')).toBeOnTheScreen();
    expect(screen.getByText('18')).toBeOnTheScreen();
    expect(screen.getByText('cents de desvío medio')).toBeOnTheScreen();
    expect(
      screen.getByText('Tu voz tiende a quedarse baja (14 cents de media).'),
    ).toBeOnTheScreen();
  });

  it('lista lo que hay que repasar por función del acorde', async () => {
    await renderScreen();

    expect(screen.getByText('3ª')).toBeOnTheScreen();
    expect(screen.getByText('7ª')).toBeOnTheScreen();
  });

  it('"Continuar" cierra el resultado', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('Continuar'));

    expect(mockDismissAll).toHaveBeenCalled();
  });

  it('decodifica solo resúmenes bien formados', () => {
    expect(decodeSingingSummary(encodeSingingSummary(SUMMARY))).toEqual(SUMMARY);
    expect(decodeSingingSummary('{"total":"x"}')).toBeNull();
    expect(decodeSingingSummary('no es json')).toBeNull();
    expect(decodeSingingSummary(undefined)).toBeNull();
  });
});
