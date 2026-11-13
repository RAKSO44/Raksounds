import { ReactNode } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/shared/settings';
import { ThemeProvider } from '@/shared/theme';

import { decodeRoundSummary } from '../../summaryParams';
import { ExerciseRoundScreen } from '../ExerciseRoundScreen';

const mockDismissAll = jest.fn();
const mockReplace = jest.fn();
let mockParams: { mode?: string; level?: string } = { mode: 'interval', level: '3' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: mockReplace,
    dismissAll: mockDismissAll,
  }),
  useLocalSearchParams: () => mockParams,
}));

// Se mockea solo la frontera nativa: el flujo UI → dominio → IAudioPlayer es real.
const mockNoteOn = jest.fn<number, [number]>();
const mockNoteOff = jest.fn();
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    noteOff: (handle: number) => mockNoteOff(handle),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
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

const renderScreen = () => render(<ExerciseRoundScreen />, { wrapper: Providers });

/**
 * Con `Math.random` fijo en 0 la ronda es determinista: nota base C4, y en el
 * nivel 3 la respuesta del primer ejercicio es la 8ª justa, con la 4ª justa y
 * la 3ª mayor como distractores.
 */
const ANSWER = '8ª';
const WRONG = '4ª';

/** Los tests que recorren los diez ejercicios necesitan más margen. */
const LONG_ROUND_TIMEOUT_MS = 30000;

let nextVoice = 0;
beforeEach(() => {
  mockParams = { mode: 'interval', level: '3' };
  useSettingsStore.setState({ showOctave: true });
  jest.spyOn(Math, 'random').mockReturnValue(0);
  mockDismissAll.mockClear();
  mockReplace.mockClear();
  nextVoice = 0;
  mockNoteOn.mockReset();
  mockNoteOn.mockImplementation(() => {
    nextVoice += 1;
    return nextVoice;
  });
  mockNoteOff.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ExerciseRoundScreen — identificación de intervalo', () => {
  it('muestra la nota base y oculta la nota a adivinar', async () => {
    await renderScreen();

    expect(screen.getByText('C4')).toBeOnTheScreen();
    expect(screen.getByText('?')).toBeOnTheScreen();
  });

  it('cada tecla suena su propia altura y se puede pulsar varias veces', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Nota base C4'));
    await user.press(screen.getByLabelText('Nota a adivinar'));
    await user.press(screen.getByLabelText('Nota base C4'));

    // C4 = 60; la nota a adivinar está una octava justa por encima (72).
    expect(mockNoteOn.mock.calls).toEqual([[60], [72], [60]]);
    // Cada pulsación libera SU voz, no la de otra tecla.
    expect(mockNoteOff.mock.calls).toEqual([[1], [2], [3]]);
  });

  it('el botón empieza en Confirmar y se habilita al elegir una opción', async () => {
    const user = userEvent.setup();
    await renderScreen();

    expect(screen.getByText('Confirmar')).toBeOnTheScreen();

    // Sin selección, confirmar no corrige nada: el botón sigue diciendo lo mismo.
    await user.press(screen.getByText('Confirmar'));
    expect(screen.getByText('Confirmar')).toBeOnTheScreen();

    await user.press(screen.getByText(WRONG));
    await user.press(screen.getByText('Confirmar'));
    expect(screen.getByText('Continuar')).toBeOnTheScreen();
  });

  it('al acertar revela la nota oculta y pasa al siguiente ejercicio', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText(ANSWER));
    await user.press(screen.getByText('Confirmar'));

    expect(screen.getByText('¡Correcto!')).toBeOnTheScreen();
    // La nota a adivinar deja de ser un "?" y muestra qué era.
    expect(screen.queryByText('?')).not.toBeOnTheScreen();
    expect(screen.getByText('C5')).toBeOnTheScreen();

    await user.press(screen.getByText('Continuar'));
    expect(screen.getByText('Confirmar')).toBeOnTheScreen();
    expect(screen.getByText('?')).toBeOnTheScreen();
  });

  it('al fallar nombra el intervalo correcto y revela la nota igualmente', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText(WRONG));
    await user.press(screen.getByText('Confirmar'));

    expect(screen.getByText('Era 8ª justa')).toBeOnTheScreen();
    expect(screen.getByText('C5')).toBeOnTheScreen();
    expect(screen.getByText('Continuar')).toBeOnTheScreen();
  });

  it(
    'tras diez ejercicios salta a la pantalla de resultados con el resumen',
    async () => {
      // En el nivel 1 solo hay dos intervalos, así que con `Math.random` fijo los
      // diez ejercicios son iguales y la ronda se puede recorrer entera.
      mockParams = { mode: 'interval', level: '1' };
      const user = userEvent.setup();
      await renderScreen();

      for (let i = 0; i < 10; i += 1) {
        if (i === 0) {
          // Solo en el primer ejercicio: la base suena dos veces y la nota a
          // adivinar una. La segunda vuelta a la base es UNA repetición.
          await user.press(screen.getByLabelText('Nota base C4'));
          await user.press(screen.getByLabelText('Nota a adivinar'));
          await user.press(screen.getByLabelText('Nota base C4'));
        }
        await user.press(screen.getByText(ANSWER));
        await user.press(screen.getByText('Confirmar'));
        await user.press(screen.getByText('Continuar'));
      }

      // La ronda se REEMPLAZA por su resultado: no se puede volver a unos
      // ejercicios ya respondidos.
      expect(mockReplace).toHaveBeenCalledTimes(1);
      const call = mockReplace.mock.calls[0][0];
      expect(call.pathname).toBe('/exercise/summary');
      const summary = decodeRoundSummary(call.params.summary);
      expect(summary?.correctCount).toBe(10);
      expect(summary?.missedIntervals).toEqual([]);
      // Una repetición en diez preguntas: 0,1 de media. Lo que se escucha por
      // primera vez no cuenta, ni siquiera oír las dos notas del ejercicio.
      expect(summary?.averageReplays).toBeCloseTo(0.1);
      // Recorrer la ronda entera son 30 pulsaciones simuladas: no cabe en el
      // timeout por defecto de Jest.
    },
    LONG_ROUND_TIMEOUT_MS,
  );

  it(
    'el resumen cuenta los fallos y los lista para repasar',
    async () => {
      mockParams = { mode: 'interval', level: '1' };
      const user = userEvent.setup();
      await renderScreen();

      for (let i = 0; i < 10; i += 1) {
        // El primer ejercicio se falla a propósito: la 5ª justa es el otro
        // intervalo del nivel 1.
        await user.press(screen.getByText(i === 0 ? '5ª' : ANSWER));
        await user.press(screen.getByText('Confirmar'));
        await user.press(screen.getByText('Continuar'));
      }

      const summary = decodeRoundSummary(mockReplace.mock.calls[0][0].params.summary);
      expect(summary?.correctCount).toBe(9);
      expect(summary?.missedIntervals).toEqual(['P8']);
    },
    LONG_ROUND_TIMEOUT_MS,
  );
});

describe('ExerciseRoundScreen — salir de la ronda', () => {
  it('la flecha pide confirmación antes de abandonar', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Volver'));
    expect(screen.getByText('¿Salir de la ronda?')).toBeOnTheScreen();
    // Mientras no se confirme, la ronda sigue donde estaba.
    expect(mockDismissAll).not.toHaveBeenCalled();

    await user.press(screen.getByText('Seguir'));
    expect(screen.queryByText('¿Salir de la ronda?')).not.toBeOnTheScreen();
    expect(mockDismissAll).not.toHaveBeenCalled();

    await user.press(screen.getByLabelText('Volver'));
    await user.press(screen.getByText('Salir'));
    expect(mockDismissAll).toHaveBeenCalled();
  });
});

describe('ExerciseRoundScreen — identificación de nota', () => {
  beforeEach(() => {
    mockParams = { mode: 'note', level: '3' };
  });

  it('las opciones no muestran su nota: suenan al pulsarlas', async () => {
    const user = userEvent.setup();
    await renderScreen();

    expect(screen.getByText('¿Cuál de estas es su 8ª justa?')).toBeOnTheScreen();
    // Las opciones son solo sonido: no llevan ni la nota ni una letra que las
    // nombre en pantalla.
    expect(screen.queryByText('A')).not.toBeOnTheScreen();

    await user.press(screen.getByLabelText('Opción A'));
    // La primera opción es la 4ª justa sobre C4: F4 (65).
    expect(mockNoteOn).toHaveBeenCalledWith(65);
  });

  it('volver a pulsar la opción ya elegida la vuelve a hacer sonar', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Opción A'));
    await user.press(screen.getByLabelText('Opción A'));

    expect(mockNoteOn.mock.calls).toEqual([[65], [65]]);
  });

  it('al fallar dice QUÉ marcaste, no cuál era: el intervalo pedido ya estaba en el enunciado', async () => {
    const user = userEvent.setup();
    await renderScreen();

    // La opción A es la 4ª justa y el ejercicio pide la 8ª justa.
    await user.press(screen.getByLabelText('Opción A'));
    await user.press(screen.getByText('Confirmar'));

    expect(screen.getByText('Marcaste 4ª justa')).toBeOnTheScreen();
    expect(screen.queryByText('Era 8ª justa')).not.toBeOnTheScreen();
  });

  it('al corregir, todas las opciones revelan qué nota eran', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Opción A'));
    await user.press(screen.getByText('Confirmar'));

    // C4 + 4ª justa = F4, + 3ª mayor = E4, + 8ª justa = C5.
    for (const note of ['F4', 'E4', 'C5']) {
      expect(screen.getByText(note)).toBeOnTheScreen();
    }
  });
});
