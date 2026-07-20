import { createExpoAudioPlayer } from '../ExpoAudioPlayer';
import { PIANO_SAMPLES } from '../pianoSampleMap';

/** Debe coincidir con VOICES_PER_SAMPLE de ExpoAudioPlayer.ts. */
const VOICES = 3;

// Se mockea el módulo nativo: aquí se testea la lógica del pool, la afinación y
// el corte por duración, no expo-audio en sí.
jest.mock('expo-audio', () => {
  const createMockPlayer = () => ({
    playing: false,
    shouldCorrectPitch: true,
    volume: 1,
    setPlaybackRate: jest.fn(),
    seekTo: jest.fn(),
    play: jest.fn(function (this: { playing: boolean }) {
      this.playing = true;
    }),
    pause: jest.fn(function (this: { playing: boolean }) {
      this.playing = false;
    }),
    remove: jest.fn(),
  });
  return {
    createAudioPlayer: jest.fn(() => createMockPlayer()),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAudioPlayer, setAudioModeAsync } = require('expo-audio') as {
  createAudioPlayer: jest.Mock;
  setAudioModeAsync: jest.Mock;
};

/** Primera voz (índice en createAudioPlayer.mock.results) de la muestra `sampleIndex`. */
const voice = (sampleIndex: number, v = 0) => createAudioPlayer.mock.results[sampleIndex * VOICES + v].value;

beforeEach(() => {
  jest.useFakeTimers();
  createAudioPlayer.mockClear();
  setAudioModeAsync.mockClear();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('createExpoAudioPlayer', () => {
  it('load() configura el modo de audio y precarga varias voces por muestra', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true }),
    );
    expect(createAudioPlayer).toHaveBeenCalledTimes(PIANO_SAMPLES.length * VOICES);
  });

  it('los players se crean con la corrección de pitch desactivada', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    for (const result of createAudioPlayer.mock.results) {
      expect(result.value.shouldCorrectPitch).toBe(false);
    }
  });

  it('el warm-up dispara un setPlaybackRate ≠ 1 en mudo para consumir la rareza de expo-audio', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    // Cada voz recibe, al crearse, un setPlaybackRate con un rate distinto de 1
    // (el que expo-audio ignoraría en la primera reproducción real).
    for (const result of createAudioPlayer.mock.results) {
      const rates = result.value.setPlaybackRate.mock.calls.map((c: [number]) => c[0]);
      expect(rates).toContain(2 ** (1 / 12));
    }
  });

  it('playNote sin load() lanza error', () => {
    const player = createExpoAudioPlayer();
    expect(() => player.playNote(60)).toThrow(/load\(\)/);
  });

  it('playNote de una altura exacta reproduce con rate 1', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60); // C4: existe muestra exacta (índice 8 en PIANO_SAMPLES)

    const c4 = voice(8);
    expect(c4.setPlaybackRate).toHaveBeenLastCalledWith(1);
    expect(c4.seekTo).toHaveBeenLastCalledWith(0);
    expect(c4.play).toHaveBeenCalled();
  });

  it('playNote de una altura intermedia afina la muestra más cercana', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4 → muestra D♯4 (índice 9), un semitono abajo

    const ds4 = voice(9);
    expect(ds4.setPlaybackRate).toHaveBeenLastCalledWith(Math.pow(2, -1 / 12));
    expect(ds4.play).toHaveBeenCalled();
  });

  it('no crea players en caliente: todas las voces se precargan en load()', async () => {
    const player = createExpoAudioPlayer();
    await player.load();
    const created = createAudioPlayer.mock.calls.length;

    player.playNote(62);
    player.playNote(64);
    player.playNote(60);

    expect(createAudioPlayer.mock.calls.length).toBe(created);
  });

  it('dos notas que comparten muestra suenan a la vez (voces distintas del pool)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4 → muestra D♯4 (índice 9), voz 0
    player.playNote(64); // E4 → también muestra D♯4, voz 1

    const v0 = voice(9, 0);
    const v1 = voice(9, 1);
    expect(v0).not.toBe(v1);
    expect(v0.playing).toBe(true); // la primera nota sigue sonando
    expect(v1.play).toHaveBeenCalled();
  });

  it('spamear la misma tecla re-dispara la nota (para y vuelve a reproducir)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    // Cuatro pulsaciones seguidas: round-robin recorre las 3 voces y reutiliza
    // la primera, que debe pausarse y reproducirse de nuevo (no quedar en no-op).
    for (let i = 0; i < VOICES + 1; i += 1) player.playNote(60);

    const reused = voice(8, 0);
    expect(reused.play.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(reused.pause).toHaveBeenCalled();
  });

  it('corta la nota tras la duración máxima (no suena indefinidamente)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60);
    const c4 = voice(8);
    expect(c4.playing).toBe(true);

    jest.advanceTimersByTime(2000); // supera MAX_NOTE_MS + fundido
    expect(c4.playing).toBe(false);
  });

  it('playNote fuera de rango lanza error', async () => {
    const player = createExpoAudioPlayer();
    await player.load();
    expect(() => player.playNote(20)).toThrow(/rango/);
    expect(() => player.playNote(110)).toThrow(/rango/);
  });

  it('stopAll pausa todos los players', async () => {
    const player = createExpoAudioPlayer();
    await player.load();
    player.playNote(60);
    player.playNote(62);

    player.stopAll();

    for (const result of createAudioPlayer.mock.results) {
      expect(result.value.pause).toHaveBeenCalled();
    }
  });

  it('unload libera todos los players y exige load() de nuevo', async () => {
    const player = createExpoAudioPlayer();
    await player.load();
    await player.unload();

    for (const result of createAudioPlayer.mock.results) {
      expect(result.value.remove).toHaveBeenCalled();
    }
    expect(() => player.playNote(60)).toThrow(/load\(\)/);
  });
});
