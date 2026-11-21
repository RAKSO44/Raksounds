import { ReactNode, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen, userEvent } from '@testing-library/react-native';

import { completeTheory, EMPTY_PROGRESS, recordPractice } from '@/domain/lessons';
import { ThemeProvider } from '@/shared/theme';

import { useLessonProgressStore } from '../../progressStore';
import { useStageSelectionStore } from '../../stageSelection';
import { HomeScreen } from '../HomeScreen';

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

const mockPush = jest.fn();
const mockUseEffect = useEffect;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  // Enfocada desde el primer render, como la pestaña visible.
  useFocusEffect: (effect: () => void) => mockUseEffect(effect, [effect]),
}));

const AT = '2026-11-16T10:00:00.000Z';
const DONE = recordPractice(completeTheory(EMPTY_PROGRESS, AT), 14, 15, AT);

beforeEach(() => {
  mockPush.mockClear();
  useLessonProgressStore.setState({ modules: {} });
  useStageSelectionStore.setState({ pending: null, last: 0 });
});

const renderScreen = () => render(<HomeScreen />, { wrapper: Providers });
const MODULE_1 = /^Módulo 1: Las notas musicales/;

describe('HomeScreen', () => {
  it('muestra las etapas 1 a 4 con todos sus módulos, sin bloqueos', async () => {
    await renderScreen();
    expect(screen.getByLabelText(/^Etapa 1: Introducción/)).toBeTruthy();
    expect(screen.getByLabelText('Etapa 2: Ritmo')).toBeTruthy();
    expect(screen.getByLabelText('Etapa 3: Notas y distancias')).toBeTruthy();
    expect(screen.getByLabelText('Etapa 4: Escalas, intervalos y tonalidades')).toBeTruthy();
    expect(screen.getByLabelText('Módulo 1: Las notas musicales. Sin empezar')).toBeTruthy();
    expect(screen.getByLabelText('Módulo 2: Pulso y tempo. Sin empezar')).toBeTruthy();
    expect(screen.getByLabelText('Módulo 3: Figuras musicales. Sin empezar')).toBeTruthy();
    expect(
      screen.getByLabelText('Módulo 6: Lectura de charts rítmicos. Próximamente'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Módulo 12: Intervalos. Próximamente')).toBeTruthy();
    expect(screen.getByLabelText('Módulo 16: Círculo de quintas. Próximamente')).toBeTruthy();
  });

  it('la tarjeta de etapa abre la pantalla de etapas con la actual', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText(/Ver todas las etapas$/));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/stages', params: { current: '0' } });
  });

  it('al tocar un módulo se abre con su temario y entra a Teoría o a Ejercicios', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText(MODULE_1));
    expect(screen.getByText('Octavas')).toBeTruthy();

    await user.press(screen.getByLabelText('Teoría'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lesson/theory',
      params: { module: 'notes' },
    });

    await user.press(screen.getByLabelText('Ejercicios'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/lesson/practice',
      params: { module: 'notes' },
    });
  });

  it('se puede entrar al módulo 2 sin haber hecho el 1', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText(/^Módulo 2: Pulso y tempo/));
    await user.press(screen.getByLabelText('Ejercicios'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lesson/practice',
      params: { module: 'pulse' },
    });
  });

  it('abrir otro módulo cierra el abierto, y tocar el temario lo cierra', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText(MODULE_1));
    expect(screen.getByText('Octavas')).toBeTruthy();

    await user.press(screen.getByLabelText(/^Módulo 2: Pulso y tempo/));
    expect(screen.queryByText('Octavas')).toBeNull();
    expect(screen.getByText('BPM')).toBeTruthy();

    await user.press(screen.getByLabelText('Cerrar módulo 2'));
    expect(screen.queryByText('BPM')).toBeNull();
  });

  it('un módulo sin lección avisa de que llega pronto', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText(/^Módulo 4: Silencios y prolongaciones/));
    expect(screen.getByText('Próximamente')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    await user.press(screen.getByText('Entendido'));
  });

  it('el módulo 3 abre su teoría, pero sus ejercicios avisan de que llegan pronto', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText(/^Módulo 3: Figuras musicales/));

    await user.press(screen.getByLabelText('Teoría'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lesson/theory',
      params: { module: 'figures' },
    });

    await user.press(screen.getByLabelText('Ejercicios'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        'Los ejercicios del módulo 3, «Figuras musicales», estarán disponibles muy pronto.',
      ),
    ).toBeTruthy();
    await user.press(screen.getByText('Entendido'));
  });

  it('marca por separado la teoría leída y los ejercicios completados', async () => {
    useLessonProgressStore.setState({
      modules: { notes: completeTheory(EMPTY_PROGRESS, AT), pulse: DONE },
    });
    const user = userEvent.setup();
    await renderScreen();
    expect(screen.getByLabelText('Módulo 1: Las notas musicales. Teoría leída')).toBeTruthy();
    expect(
      screen.getByLabelText('Módulo 2: Pulso y tempo. Teoría leída y ejercicios completados'),
    ).toBeTruthy();

    await user.press(screen.getByLabelText(MODULE_1));
    expect(screen.getByLabelText('Teoría (leída)')).toBeTruthy();
    expect(screen.getByLabelText('Ejercicios')).toBeTruthy();
  });

  it('el engranaje abre la configuración', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText('Configuración'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('tocar un módulo guarda su etapa como la última usada', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Módulo 12: Intervalos. Próximamente'));
    expect(useStageSelectionStore.getState().last).toBe(3);
  });
});
