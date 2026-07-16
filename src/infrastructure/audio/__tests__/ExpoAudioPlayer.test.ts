import { createExpoAudioPlayer } from '../ExpoAudioPlayer';
import { PIANO_SAMPLES } from '../pianoSampleMap';

// Se mockea el módulo nativo: aquí se testea la lógica del pool y la afinación,
// no expo-audio en sí.
jest.mock('expo-audio', () => {
  const createMockPlayer = () => ({
    playing: false,
    shouldCorrectPitch: true,
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

beforeEach(() => {
  createAudioPlayer.mockClear();
  setAudioModeAsync.mockClear();
});

describe('createExpoAudioPlayer', () => {
  it('load() configura el modo de audio y precarga un player por muestra', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true }),
    );
    expect(createAudioPlayer).toHaveBeenCalledTimes(PIANO_SAMPLES.length);
  });

  it('los players se crean con la corrección de pitch desactivada', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    for (const result of createAudioPlayer.mock.results) {
      expect(result.value.shouldCorrectPitch).toBe(false);
    }
  });

  it('playNote sin load() lanza error', () => {
    const player = createExpoAudioPlayer();
    expect(() => player.playNote(60)).toThrow(/load\(\)/);
  });

  it('playNote de una altura exacta reproduce con rate 1', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60); // C4: existe muestra exacta

    const c4Player = createAudioPlayer.mock.results[8].value; // índice de C4 en PIANO_SAMPLES
    expect(c4Player.setPlaybackRate).toHaveBeenCalledWith(1);
    expect(c4Player.seekTo).toHaveBeenCalledWith(0);
    expect(c4Player.play).toHaveBeenCalled();
  });

  it('playNote de una altura intermedia afina la muestra más cercana', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4 → muestra D♯4 (63), un semitono abajo

    const ds4Player = createAudioPlayer.mock.results[9].value;
    expect(ds4Player.setPlaybackRate).toHaveBeenCalledWith(Math.pow(2, -1 / 12));
    expect(ds4Player.play).toHaveBeenCalled();
  });

  it('dos notas que comparten muestra suenan a la vez (crea un segundo player)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4 → muestra D♯4, queda sonando
    const before = createAudioPlayer.mock.calls.length;

    player.playNote(64); // E4 → también muestra D♯4 → segundo player
    expect(createAudioPlayer.mock.calls.length).toBe(before + 1);
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
