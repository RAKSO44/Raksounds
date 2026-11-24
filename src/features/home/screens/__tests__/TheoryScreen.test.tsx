import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { useLessonProgressStore } from '../../progressStore';
import { TheoryScreen } from '../TheoryScreen';

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
let mockParams: { module?: string } = { module: 'notes' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const mockNoteOn = jest.fn<number, [number]>(() => 1);
const mockPlayTimed = jest.fn<number, [number, number, number]>(() => 1);
const mockNoteOff = jest.fn();
jest.mock('@/infrastructure/audio/PianoSamplerPlayer', () => ({
  createPianoSamplerPlayer: () => ({
    load: jest.fn().mockResolvedValue(undefined),
    noteOn: (midi: number) => mockNoteOn(midi),
    playTimed: (midi: number, atMs: number, durationMs: number) =>
      mockPlayTimed(midi, atMs, durationMs),
    noteOff: (handle: number, atMs?: number) => mockNoteOff(handle, atMs),
    stopAll: jest.fn(),
    unload: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockBack.mockClear();
  mockNoteOn.mockClear();
  mockPlayTimed.mockClear();
  mockParams = { module: 'notes' };
  useLessonProgressStore.setState({ modules: {} });
});

afterEach(() => {
  jest.useRealTimers();
});

const renderScreen = () => render(<TheoryScreen />, { wrapper: Providers });
const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('TheoryScreen (Módulo 1)', () => {
  it('se recorre sin hacer nada obligatorio y el check da la teoría por leída', async () => {
    const user = setupUser();
    await renderScreen();

    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    expect(screen.queryByLabelText('Página anterior')).toBeNull();
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByText('¿Qué orden siguen?')).toBeTruthy();
    await user.press(screen.getByLabelText('Página anterior'));
    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    await user.press(screen.getByLabelText('Página siguiente'));
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByLabelText('Página 3 de 3')).toBeTruthy();
    expect(useLessonProgressStore.getState().modules.notes).toBeUndefined();
    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.notes?.theoryCompleted).toBe(true);
    expect(mockBack).toHaveBeenCalled();
  });

  it('la tabla hace sonar cada nota y explica sus columnas', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    await user.press(screen.getByLabelText('Escuchar SOL'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockNoteOn).toHaveBeenCalledWith(67);

    await user.press(screen.getByLabelText('¿Qué es cifrado?'));
    expect(screen.getByText(/sistema universal de nombramiento/)).toBeTruthy();
    // Volver a tocar el título la cierra.
    await user.press(screen.getByLabelText('¿Qué es cifrado?'));
    expect(screen.queryByText(/sistema universal de nombramiento/)).toBeNull();
  });

  it('las teclas de la página 2 suenan y "octava" se define al tocarla', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    await user.press(screen.getAllByLabelText('?')[0]);
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockNoteOn).toHaveBeenCalledWith(72);

    await user.press(screen.getByText('octava'));
    expect(screen.getByText(/entre dos notas con el mismo nombre/)).toBeTruthy();
  });

  it('cada módulo tiene sus páginas', async () => {
    for (const [module, total] of [
      ['notes', 3],
      ['pulse', 2],
      ['figures', 4],
      ['rests', 5],
    ] as const) {
      mockParams = { module };
      const { unmount } = await renderScreen();
      expect(screen.getByLabelText(`Página 1 de ${total}`)).toBeTruthy();
      await unmount();
    }
  });
});

describe('TheoryScreen (Módulo 2)', () => {
  const { metronome } = jest.requireMock<{
    metronome: { loop: jest.Mock; stop: jest.Mock };
  }>('@/infrastructure/audio/metronome');

  beforeEach(() => {
    mockParams = { module: 'pulse' };
    metronome.loop.mockClear();
  });

  it('el corazón arranca y detiene un pulso continuo con acentos', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(screen.getByText('¿Qué es el pulso?')).toBeTruthy();
    await user.press(screen.getByLabelText('Escuchar el pulso'));
    expect(metronome.loop).toHaveBeenCalledTimes(1);
    const { bpm, isAccent } = metronome.loop.mock.calls[0][0];
    expect(bpm).toBe(80);
    expect([0, 1, 4].map(isAccent)).toEqual([true, false, true]);

    const handle = metronome.loop.mock.results[0].value;
    await user.press(screen.getByLabelText('Detener el pulso'));
    expect(handle.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Escuchar el pulso')).toBeTruthy();
  });

  it('"constante" se define al tocarla', async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByText('constante'));
    expect(screen.getByText('Siempre la misma velocidad')).toBeTruthy();
  });

  it('la hoja 2 cambia el tempo con la barra, en vivo, y nombra su indicación', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    expect(screen.getByText('¿Qué es el tempo?')).toBeTruthy();
    expect(screen.getByText('BPM: 100')).toBeTruthy();
    expect(screen.getByText('Andante')).toBeTruthy();

    await user.press(screen.getByLabelText('Escuchar el pulso'));
    const handle = metronome.loop.mock.results[0].value;

    const slider = screen.getByLabelText('Tempo');
    for (let i = 0; i < 8; i += 1) {
      await act(() =>
        slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }),
      );
    }
    expect(screen.getByText('BPM: 108')).toBeTruthy();
    expect(screen.getByText('Moderato')).toBeTruthy();
    expect(handle.setBpm).toHaveBeenLastCalledWith(108);

    await user.press(screen.getByText('Moderato'));
    expect(screen.getByText('Indicaciones de tempo. Se usan en partituras')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: 'tempo' }));
    expect(screen.getByText('Velocidad que tiene el pulso')).toBeTruthy();

    // El check de la última hoja da la teoría por leída.
    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.pulse?.theoryCompleted).toBe(true);
  });
});

describe('TheoryScreen (Módulo 3)', () => {
  beforeEach(() => {
    mockParams = { module: 'figures' };
  });

  const placed = (name: string) =>
    screen.queryAllByLabelText(`${name}. Mantenla presionada para quitarla`);

  it('la hoja 1 compara dos figuras que suenan al tocarlas: la blanca dura el doble', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(screen.getByText('¿Qué son?')).toBeTruthy();
    expect(screen.getByLabelText('4 manzanas')).toBeTruthy();
    await user.press(screen.getByLabelText('Escuchar blanca'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    // La blanca suena justo lo que vale: dos pulsos a 72 BPM, ni un ms más.
    expect(mockPlayTimed).toHaveBeenCalledWith(60, 0, (2 * 60000) / 72);

    await user.press(screen.getByText('duración de los sonidos'));
    expect(screen.getByText('Tiempo que permanece sonando una nota')).toBeTruthy();
    expect(screen.getByText('doble ')).toBeTruthy();
    // La pregunta del pulso pasó a la hoja 3.
    expect(screen.queryByLabelText('Ver la respuesta')).toBeNull();
  });

  it('la hoja 2 selecciona una figura para ver su detalle', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await user.press(screen.getByLabelText('Página siguiente'));

    for (const name of ['Redonda', 'Blanca', 'Negra', 'Corchea', 'Semicorchea']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    for (const value of ['1 unidad', '1/2 unidad', '1/4 unidad', '1/8 unidad', '1/16 unidad']) {
      expect(screen.getByText(value)).toBeTruthy();
    }
    expect(screen.getByText('Selecciona una figura musical para ver su detalle')).toBeTruthy();

    // En la tabla las figuras no suenan: se seleccionan.
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Ver corchea'));
    await act(() => jest.advanceTimersByTimeAsync(10));
    expect(mockPlayTimed).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Ver corchea').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.queryByText('Selecciona una figura musical para ver su detalle')).toBeNull();
    expect(screen.getByLabelText('2 corcheas unidas')).toBeTruthy();

    await user.press(screen.getByLabelText('Ver semicorchea'));
    expect(screen.getByLabelText('2 semicorcheas unidas')).toBeTruthy();
    expect(screen.queryByLabelText('2 corcheas unidas')).toBeNull();

    // Tocar otra vez la elegida la deselecciona y vuelve el mensaje.
    await user.press(screen.getByLabelText('Ver semicorchea'));
    expect(screen.getByText('Selecciona una figura musical para ver su detalle')).toBeTruthy();
    expect(screen.queryByText('Para recordar:')).toBeNull();
  });

  describe('hoja 3: el pulso como referencia', () => {
    const { metronome } = jest.requireMock<{
      metronome: { loop: jest.Mock };
    }>('@/infrastructure/audio/metronome');
    const beat = 60000 / 72;

    beforeEach(() => {
      metronome.loop.mockClear();
      // El primer golpe suena 100 ms después de arrancar (como el margen real).
      metronome.loop.mockImplementation(() => ({
        startMs: performance.now() + 100,
        setBpm: jest.fn(),
        stop: jest.fn(),
      }));
    });

    afterEach(() => {
      metronome.loop.mockImplementation(() => ({ startMs: 0, setBpm: jest.fn(), stop: jest.fn() }));
      mockPlayTimed.mockImplementation(() => 1);
    });

    const openPage = async () => {
      const user = setupUser();
      await renderScreen();
      await act(() => jest.advanceTimersByTimeAsync(0));
      await user.press(screen.getByLabelText('Página siguiente'));
      await user.press(screen.getByLabelText('Página siguiente'));
      return user;
    };

    it('el corazón despliega la respuesta: el pulso es la referencia', async () => {
      const user = await openPage();
      expect(screen.getByText('¿Respecto a qué cuentan?')).toBeTruthy();
      expect(screen.getByLabelText('manzana')).toBeTruthy();

      expect(screen.queryByText(/^Exacto 😊/)).toBeNull();
      await user.press(screen.getByLabelText('Ver la respuesta'));
      expect(screen.getByText(/^Exacto 😊/)).toBeTruthy();
      expect(screen.getByText('El pulso')).toBeTruthy();
      expect(screen.getByText('¡Es el pulso!')).toBeTruthy();
      // Saltos de línea tras "personalizable." y "manzanas." (sin normalizar espacios).
      const raw = { normalizer: (text: string) => text };
      expect(screen.getByText(/personalizable\.\nNo los segundos/, raw)).toBeTruthy();
      expect(screen.getByText(/manzanas\.\n¡Es el pulso!/, raw)).toBeTruthy();

      // Se recoge al tocar de nuevo el corazón.
      await user.press(screen.getByLabelText('Ver la respuesta'));
      await act(() => jest.advanceTimersByTimeAsync(400));
      expect(screen.queryByText(/^Exacto 😊/)).toBeNull();
    });

    /** Lo que el metrónomo avisa al programar y al sonar cada golpe. */
    const loopOptions = (call = 0) => metronome.loop.mock.calls[call][0];
    /** Golpe `index` del pulso, que el metrónomo programa en `FIRST_AT + index × beat`. */
    const FIRST_AT = 5000;
    const scheduleBeat = (index: number, call = 0) =>
      act(() =>
        loopOptions(call).onSchedule({
          index,
          accent: index % 4 === 0,
          atMs: FIRST_AT + index * beat,
        }),
      );
    const hearBeat = (index: number, call = 0) =>
      act(() =>
        loopOptions(call).onBeat({ index, accent: index % 4 === 0, atMs: FIRST_AT + index * beat }),
      );

    it('el primer reproductor toca una negra en cada pulso, en el instante exacto de su golpe', async () => {
      const user = await openPage();
      mockPlayTimed.mockClear();
      await user.press(screen.getByLabelText('Escuchar la negra sobre el pulso'));
      expect(metronome.loop).toHaveBeenCalledTimes(1);
      expect(loopOptions().bpm).toBe(72);
      // Nada suena hasta que el metrónomo programa el golpe.
      expect(mockPlayTimed).not.toHaveBeenCalled();

      // Cada golpe programado programa su negra en el MISMO instante del reloj
      // de audio: sin conversiones, la figura cae exactamente sobre el golpe.
      await scheduleBeat(0);
      expect(mockPlayTimed).toHaveBeenCalledTimes(1);
      expect(mockPlayTimed.mock.calls[0][1]).toBe(FIRST_AT);
      expect(mockPlayTimed.mock.calls[0][2]).toBeCloseTo(beat);
      await hearBeat(0);
      await scheduleBeat(1);
      expect(mockPlayTimed).toHaveBeenCalledTimes(2);
      expect(mockPlayTimed.mock.calls[1][1]).toBe(FIRST_AT + beat);

      // Pausar lo detiene y vuelve a "reproducir".
      const handle = metronome.loop.mock.results[0].value;
      await user.press(screen.getByLabelText('Detener'));
      expect(handle.stop).toHaveBeenCalled();
      expect(screen.getByLabelText('Escuchar la negra sobre el pulso')).toBeTruthy();
    });

    it('el segundo reproductor suena solo el pulso o la figura elegida (que se puede quitar)', async () => {
      const user = await openPage();
      mockPlayTimed.mockClear();
      await user.press(screen.getByLabelText('Corchea sobre el pulso'));
      expect(screen.getByLabelText('Corchea sobre el pulso').props.accessibilityState).toEqual({
        selected: true,
      });

      await user.press(screen.getByLabelText('Escuchar la figura elegida sobre el pulso'));
      // Dos corcheas en el primer pulso: la primera con el golpe, la otra a medio pulso.
      let voice = 0;
      mockPlayTimed.mockImplementation(() => (voice += 1));
      await scheduleBeat(0);
      expect(mockPlayTimed.mock.calls.map((call) => call[1])).toEqual([
        FIRST_AT,
        FIRST_AT + beat / 2,
      ]);
      expect(mockPlayTimed.mock.calls.map((call) => call[2])).toEqual([beat / 2, beat / 2]);
      await hearBeat(0);
      await scheduleBeat(1);
      expect(mockPlayTimed).toHaveBeenCalledTimes(4);

      // Quitar la figura: el pulso ya programado (aún sin sonar) se queda sin
      // notas, y las de este terminan su pulso: callan justo en el próximo golpe.
      mockNoteOff.mockClear();
      mockPlayTimed.mockClear();
      await user.press(screen.getByLabelText('Corchea sobre el pulso'));
      expect(screen.getByLabelText('Corchea sobre el pulso').props.accessibilityState).toEqual({
        selected: false,
      });
      expect(mockNoteOff.mock.calls).toEqual([
        [1, FIRST_AT + beat],
        [2, FIRST_AT + beat],
        [3, undefined],
        [4, undefined],
      ]);
      expect(mockPlayTimed).not.toHaveBeenCalled();
      await hearBeat(1);
      await scheduleBeat(2);
      expect(mockPlayTimed).not.toHaveBeenCalled();

      // Elegir otra en marcha reprograma el pulso que viene, en su mismo instante.
      await user.press(screen.getByLabelText('Semicorchea sobre el pulso'));
      expect(mockPlayTimed).toHaveBeenCalledTimes(4);
      expect(mockPlayTimed.mock.calls[0][1]).toBe(FIRST_AT + 2 * beat);

      // Arrancar el otro reproductor detiene este.
      const handle = metronome.loop.mock.results[0].value;
      await user.press(screen.getByLabelText('Escuchar la negra sobre el pulso'));
      expect(handle.stop).toHaveBeenCalled();
    });
  });

  it('la barra se llena con figuras, no deja sobrepasarla y se vacía manteniéndolas', async () => {
    const user = setupUser();
    await renderScreen();
    await user.press(screen.getByLabelText('Página siguiente'));
    await user.press(screen.getByLabelText('Página siguiente'));
    await user.press(screen.getByLabelText('Página siguiente'));
    expect(screen.getByText('¡Experimenta un poco!')).toBeTruthy();
    expect(screen.getByText('Mantén presionadas')).toBeTruthy();
    expect(screen.getByText('Llena por completo la barra para escuchar cómo suena.')).toBeTruthy();

    // Tocar una figura de abajo la pone al final; no se acaban.
    await user.press(screen.getByLabelText('Blanca. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Negra. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Negra. Toca para ponerla en la barra'));
    expect(placed('Blanca')).toHaveLength(1);
    expect(placed('Negra')).toHaveLength(2);

    // Ya está llena: nada más cabe.
    await user.press(screen.getByLabelText('Semicorchea. Toca para ponerla en la barra'));
    expect(placed('Semicorchea')).toHaveLength(0);

    // Quitar una negra deja sitio para dos corcheas, y la tercera ya no entra.
    await act(() =>
      placed('Negra')[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } }),
    );
    expect(placed('Negra')).toHaveLength(1);
    for (let i = 0; i < 3; i += 1) {
      await user.press(screen.getByLabelText('Corchea. Toca para ponerla en la barra'));
    }
    expect(placed('Corchea')).toHaveLength(2);

    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.figures?.theoryCompleted).toBe(true);
  });
});

describe('TheoryScreen (Módulo 3) · reproducir la barra', () => {
  const { metronome } = jest.requireMock<{
    metronome: { play: jest.Mock };
  }>('@/infrastructure/audio/metronome');

  beforeEach(() => {
    mockParams = { module: 'figures' };
    metronome.play.mockClear();
  });

  it('se habilita al llenarla, suena sobre el pulso y se detiene con el mismo botón', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    for (let i = 0; i < 3; i += 1) await user.press(screen.getByLabelText('Página siguiente'));

    const play = () => screen.getByLabelText('Escuchar la barra');
    expect(play().props.accessibilityState).toMatchObject({ disabled: true });

    await user.press(screen.getByLabelText('Blanca. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Blanca. Toca para ponerla en la barra'));
    expect(
      screen.getByText('¡Escucha cómo suena! Recuerda que asumimos que un pulso es una negra.'),
    ).toBeTruthy();
    expect(play().props.accessibilityState).toMatchObject({ disabled: false });

    mockPlayTimed.mockClear();
    await user.press(play());
    // Cuatro golpes (la barra dura una redonda) y las dos blancas encima.
    expect(metronome.play).toHaveBeenCalledTimes(1);
    expect(metronome.play.mock.calls[0][0]).toHaveLength(4);
    expect(mockPlayTimed).toHaveBeenCalledTimes(2);

    // Pausar la corta y vuelve a "reproducir".
    await user.press(screen.getByLabelText('Detener'));
    expect(play()).toBeTruthy();

    // Al terminar, simplemente deja de sonar.
    await user.press(play());
    expect(screen.getByLabelText('Detener')).toBeTruthy();
    await act(() => jest.advanceTimersByTimeAsync(4 * (60000 / 72) + 50));
    expect(play()).toBeTruthy();
  });
});

describe('TheoryScreen (Módulo 4)', () => {
  const { metronome } = jest.requireMock<{
    metronome: { play: jest.Mock };
  }>('@/infrastructure/audio/metronome');
  const beat = 60000 / 72;

  beforeEach(() => {
    mockParams = { module: 'rests' };
    metronome.play.mockClear();
  });

  /** Las líneas miden su ancho al pintarse; en los tests se les da uno. */
  const layout = (tag: string) =>
    fireEvent(screen.getByTestId(`score-${tag}`), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 120 } },
    });
  const nextPage = async (user: ReturnType<typeof setupUser>, times: number) => {
    for (let i = 0; i < times; i += 1) await user.press(screen.getByLabelText('Página siguiente'));
  };

  it('la hoja 1 cambia negras por silencios: dejan de sonar, pero el pulso sigue', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    expect(screen.getByText('¿Qué es un silencio?')).toBeTruthy();
    await layout('rests');

    await user.press(screen.getAllByLabelText(/^Negra\. Toca para cambiarla/)[1]);
    expect(screen.getAllByLabelText(/^Silencio de negra/)).toHaveLength(1);

    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar las negras y los silencios'));
    expect(metronome.play.mock.calls[0][0]).toHaveLength(4);
    expect(mockPlayTimed).toHaveBeenCalledTimes(3);

    // Pausar lo corta en seco.
    await user.press(screen.getByLabelText('Detener'));
    expect(screen.getByLabelText('Escuchar las negras y los silencios')).toBeTruthy();
  });

  it('la hoja 2 muestra cada silencio y tres formas de ocupar lo mismo', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await nextPage(user, 1);

    await user.press(screen.getByLabelText('Ver silencio de blanca'));
    expect(screen.getByText('Silencio de blanca')).toBeTruthy();
    expect(screen.getByText('sentado')).toBeTruthy();

    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la negra y el silencio de negra'));
    expect(mockPlayTimed).toHaveBeenCalledTimes(1);
    expect(metronome.play.mock.calls[0][0]).toHaveLength(2);
  });

  it('la hoja 3 enciende el puntillo: la blanca suena la mitad más', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await nextPage(user, 2);
    expect(screen.getByText('El puntillo')).toBeTruthy();

    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la blanca'));
    expect(mockPlayTimed.mock.calls[0][2]).toBeCloseTo(2 * beat, 3);

    await user.press(screen.getByLabelText('Puntillo'));
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la blanca con puntillo'));
    expect(mockPlayTimed.mock.calls[0][2]).toBeCloseTo(3 * beat, 3);
    // La línea entera dura una redonda: el pulso sigue hasta el final.
    expect(metronome.play.mock.calls.at(-1)?.[0]).toHaveLength(4);
  });

  it('la hoja 4 liga dos negras: la segunda no se vuelve a tocar', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await nextPage(user, 3);
    expect(screen.getByText('La ligadura')).toBeTruthy();

    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar las negras sin ligadura'));
    expect(mockPlayTimed).toHaveBeenCalledTimes(4);

    await user.press(screen.getByLabelText('Ligadura'));
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar las negras con la ligadura'));
    expect(mockPlayTimed).toHaveBeenCalledTimes(3);
    expect(mockPlayTimed.mock.calls[1][2]).toBeCloseTo(2 * beat, 3);

    // Blanca con puntillo y blanca ligada a negra suenan igual.
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la blanca con puntillo'));
    const dotted = mockPlayTimed.mock.calls.map((call) => call[2]);
    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la blanca ligada a una negra'));
    expect(mockPlayTimed.mock.calls.map((call) => call[2])).toEqual(dotted);
  });

  it('la hoja 5 llena la barra con silencios, puntillo y ligadura', async () => {
    const user = setupUser();
    await renderScreen();
    await act(() => jest.advanceTimersByTimeAsync(0));
    await nextPage(user, 4);
    expect(screen.getByText('¡Experimenta un poco!')).toBeTruthy();

    await user.press(screen.getByLabelText('Blanca. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText('Negra. Toca para ponerla en la barra'));
    await user.press(screen.getByLabelText(/^Silencio de negra\. Toca para ponerlo/));
    expect(screen.getByLabelText(/^Silencio de negra\. Mantenla/)).toBeTruthy();

    // Ligar la blanca con la negra.
    await user.press(screen.getByLabelText(/^Ligadura:/));
    await user.press(screen.getByLabelText(/^Blanca\. Mantenla/));

    // Con la barra llena, el puntillo no cabe: la blanca sigue igual.
    await user.press(screen.getByLabelText(/^Puntillo:/));
    await user.press(screen.getByLabelText(/^Blanca\. Mantenla/));
    expect(screen.queryByLabelText(/^Blanca con puntillo/)).toBeNull();

    mockPlayTimed.mockClear();
    await user.press(screen.getByLabelText('Escuchar la barra'));
    // La blanca ligada a la negra es un solo sonido de tres pulsos; el silencio no suena.
    expect(mockPlayTimed).toHaveBeenCalledTimes(1);
    expect(mockPlayTimed.mock.calls[0][2]).toBeCloseTo(3 * beat, 3);

    await user.press(screen.getByLabelText('Terminar teoría'));
    expect(useLessonProgressStore.getState().modules.rests?.theoryCompleted).toBe(true);
  });
});
