import { ReactNode } from 'react';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MicrophoneFrame, MicrophoneStartResult } from '@/domain/audio';
import { midiToFrequency } from '@/domain/pitch';
import { useSettingsStore } from '@/shared/settings';
import { ThemeProvider } from '@/shared/theme';

import { decodeSingingSummary } from '../../summaryParams';
import { SingingRoundScreen } from '../SingingRoundScreen';

const mockDismissAll = jest.fn();
const mockReplace = jest.fn();
let mockParams: { kind?: string; level?: string } = { kind: 'singInterval', level: '1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: mockReplace,
    dismissAll: mockDismissAll,
  }),
  useLocalSearchParams: () => mockParams,
}));

// Frontera nativa del piano: se mockea solo el motor.
const mockNoteOn = jest.fn<number, [number]>();
const mockStopAll = jest.fn();
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    noteOff: jest.fn(),
    stopAll: () => mockStopAll(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Frontera nativa del micrófono: el test hace de "voz" entregando bloques.
let mockOnFrame: ((frame: MicrophoneFrame) => void) | null = null;
let mockStartResult: MicrophoneStartResult = 'started';
const mockMicStop = jest.fn().mockResolvedValue(undefined);
jest.mock('@/infrastructure/audio/microphone', () => ({
  microphone: {
    requestPermission: () => Promise.resolve('granted'),
    start: (onFrame: (frame: MicrophoneFrame) => void) => {
      mockOnFrame = onFrame;
      return Promise.resolve(mockStartResult);
    },
    stop: () => mockMicStop(),
  },
}));

const SAMPLE_RATE = 44100;
const BLOCK = 2048;

function block(midi: number | null): MicrophoneFrame {
  const samples = new Float32Array(BLOCK);
  if (midi !== null) {
    const frequency = midiToFrequency(midi);
    for (let i = 0; i < BLOCK; i += 1) {
      samples[i] = 0.4 * Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE);
    }
  }
  return { samples, sampleRate: SAMPLE_RATE };
}

/** Canta `midi` ~0.7 s y calla: lo justo para que la toma se cierre sola. */
async function sing(midi: number) {
  const frames = [...Array(6).fill(null), ...Array(15).fill(midi), ...Array(16).fill(null)];
  await act(async () => {
    for (const pitch of frames) mockOnFrame?.(block(pitch));
  });
}

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

const renderScreen = () => render(<SingingRoundScreen />, { wrapper: Providers });

const LONG_ROUND_TIMEOUT_MS = 30000;

beforeEach(() => {
  // Con Math.random = 0 la ronda es determinista: base C4 y, en el nivel 1 de
  // intervalos, la 8ª justa (hay que cantar un Do).
  mockParams = { kind: 'singInterval', level: '1' };
  mockStartResult = 'started';
  mockOnFrame = null;
  useSettingsStore.setState({ showOctave: true });
  jest.spyOn(Math, 'random').mockReturnValue(0);
  mockReplace.mockClear();
  mockNoteOn.mockReset();
  mockNoteOn.mockReturnValue(1);
  mockStopAll.mockClear();
  mockMicStop.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SingingRoundScreen — entonación de intervalos', () => {
  it('muestra la nota base y lo que hay que cantar, sin delatar la nota objetivo', async () => {
    await renderScreen();

    expect(screen.getByText('C4')).toBeOnTheScreen();
    expect(screen.getByText('Canta una 8ª justa ascendente')).toBeOnTheScreen();
    expect(screen.queryByText('C5')).toBeNull();
    expect(screen.getByText('Toca el micrófono y canta')).toBeOnTheScreen();
  });

  it('"Continuar" está deshabilitado hasta cantar', async () => {
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('cantar clavado (en cualquier octava) da "¡Perfecto!"', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    // Silencia el piano antes de escuchar, para que no se cuele en la toma.
    expect(mockStopAll).toHaveBeenCalled();

    // Do3: una voz grave cantando una octava abajo.
    await sing(48);

    expect(screen.getByText('¡Perfecto!')).toBeOnTheScreen();
    expect(screen.getByText('C5, justo en el centro')).toBeOnTheScreen();
    // Sobre la hoja, la barra de afinación centrada en la nota pedida.
    expect(screen.getByLabelText(/^Afinación: -?\d+ cents respecto a C5$/)).toBeOnTheScreen();
    expect(mockMicStop).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('cantar otra nota dice qué intervalo salió', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await sing(67);

    expect(screen.getByText('Esa no era')).toBeOnTheScreen();
    expect(screen.getByText('Cantaste una 5ª justa; era C5')).toBeOnTheScreen();
    // Otra nota: la aguja se pega al borde y dice hacia qué lado.
    expect(screen.getByText('« más grave')).toBeOnTheScreen();
    // Al corregir aparece la tecla con la nota que había que cantar.
    expect(screen.getByText('Había que cantar')).toBeOnTheScreen();
  });

  it('afinado pero no clavado: "¡Afinado!"', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await sing(71.82);

    expect(screen.getByText('¡Afinado!')).toBeOnTheScreen();
  });

  it('desafinado pero en la nota: "¡Casi!", con cuánto y hacia dónde', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await sing(71.65);

    expect(screen.getByText('¡Casi!')).toBeOnTheScreen();
    expect(screen.getByText(/C5, 3\d cents bajo/)).toBeOnTheScreen();
  });

  it('sin voz no califica: pide volver a cantar', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await act(async () => {
      for (let i = 0; i < 120; i += 1) mockOnFrame?.(block(null));
    });

    expect(
      screen.getByText('No te escuché bien. Toca el micrófono y vuelve a cantar'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('sin permiso de micrófono ofrece activarlo, sin texto bajo el micro', async () => {
    mockStartResult = 'denied';
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));

    expect(screen.getByText('Activa el micrófono')).toBeOnTheScreen();
    expect(screen.queryByText(/ajustes del sistema/)).toBeNull();

    await user.press(screen.getByText('Activar'));

    expect(openSettings).toHaveBeenCalled();
    expect(screen.queryByText('Activa el micrófono')).toBeNull();
  });

  it('"Ahora no" cierra el aviso de permiso', async () => {
    mockStartResult = 'denied';
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await user.press(screen.getByText('Ahora no'));

    expect(screen.queryByText('Activa el micrófono')).toBeNull();
    expect(screen.getByText('Toca el micrófono y canta')).toBeOnTheScreen();
  });

  it(
    'al terminar los diez ejercicios reemplaza la ronda por el resumen',
    async () => {
      const user = userEvent.setup();
      await renderScreen();

      for (let i = 0; i < 10; i += 1) {
        await user.press(screen.getByRole('button', { name: 'Cantar' }));
        // Con random = 0 todas las preguntas son la 8ª justa sobre C.
        await sing(72);
        await user.press(screen.getByRole('button', { name: 'Continuar' }));
      }

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const { pathname, params } = mockReplace.mock.calls[0][0];
      expect(pathname).toBe('/exercise/sing-summary');
      const summary = decodeSingingSummary(params.summary);
      expect(summary?.correctCount).toBe(10);
      expect(summary?.averageCentsOff).toBeLessThan(5);
    },
    LONG_ROUND_TIMEOUT_MS,
  );
});

describe('SingingRoundScreen — entonación de notas', () => {
  it('una sola tecla hace sonar todas las notas del acorde a la vez', async () => {
    mockParams = { kind: 'singNote', level: '3' };
    const user = userEvent.setup();
    await renderScreen();

    // Nivel 3 con random = 0: tríada de C mayor, se pide la fundamental.
    expect(screen.getByText('Canta la fundamental')).toBeOnTheScreen();
    // La tecla lleva el nombre del acorde.
    expect(screen.getByText('C')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Acorde' }));

    expect(mockNoteOn.mock.calls.map(([midi]) => midi)).toEqual([60, 64, 67]);
  });

  it('cantar otra nota del acorde lo nombra por su función', async () => {
    mockParams = { kind: 'singNote', level: '3' };
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await sing(67);

    expect(screen.getByText('Cantaste la 5ª; era C4')).toBeOnTheScreen();
  });

  it('al corregir cambia la tecla por un teclado: cada nota suena sola y se puede oír el acorde', async () => {
    mockParams = { kind: 'singNote', level: '3' };
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Cantar' }));
    await sing(67);

    expect(screen.queryByRole('button', { name: 'Acorde' })).toBeNull();
    expect(screen.getByText('Era esta: C4')).toBeOnTheScreen();

    mockNoteOn.mockClear();
    await user.press(screen.getByRole('button', { name: '3ª: E4' }));
    expect(mockNoteOn.mock.calls.map(([midi]) => midi)).toEqual([64]);

    mockNoteOn.mockClear();
    await user.press(screen.getByRole('button', { name: 'Escuchar el acorde completo: C' }));
    expect(mockNoteOn.mock.calls.map(([midi]) => midi)).toEqual([60, 64, 67]);
  });
});
