import { createExpoAudioPlayer } from '../ExpoAudioPlayer';
import { PIANO_SAMPLES } from '../pianoSampleMap';

/** Debe coincidir con VOICES_PER_NOTE de ExpoAudioPlayer.ts. */
const VOICES = 2;

/** Justo antes de que arranque el fundido (MAX_NOTE_MS - FADE_MS). */
const JUST_BEFORE_FADE_MS = 1700;

// Se mockea el módulo nativo: aquí se testea la lógica del pool, el rebobinado
// y el corte por duración, no expo-audio en sí.
jest.mock('expo-audio', () => {
  const createMockPlayer = () => ({
    playing: false,
    volume: 1,
    setPlaybackRate: jest.fn(),
    // seekTo es asíncrono en expo-audio; el mock lo refleja porque el orden
    // seekTo→play es justamente lo que se quiere verificar.
    seekTo: jest.fn().mockResolvedValue(undefined),
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

/** Índice de una nota MIDI dentro de PIANO_SAMPLES (banco cromático desde C4). */
const noteIndex = (midi: number) => PIANO_SAMPLES.findIndex((s) => s.midi === midi);

/** Voz `v` del pool de la nota `midi`. */
const voice = (midi: number, v = 0) =>
  createAudioPlayer.mock.results[noteIndex(midi) * VOICES + v].value;

/** Vacía la cola de microtareas (el rebobinado encadena varias Promises). */
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

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
  it('load() configura el modo de audio y precarga varias voces por nota', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true }),
    );
    expect(createAudioPlayer).toHaveBeenCalledTimes(PIANO_SAMPLES.length * VOICES);
  });

  it('NUNCA toca el playback rate: el banco es cromático', async () => {
    // Regresión del bug de afinación: setPlaybackRate no se aplica desde la
    // muestra 0, así que las notas arrancaban con la altura de la muestra cruda.
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60); // C4
    player.playNote(62); // D4 — antes se afinaba desde la muestra D♯4
    player.playNote(65); // F4 — antes se afinaba desde la muestra F♯4
    player.playNote(71); // B4 — antes se afinaba desde la muestra C5
    await flush();

    for (const result of createAudioPlayer.mock.results) {
      expect(result.value.setPlaybackRate).not.toHaveBeenCalled();
    }
  });

  it('cada nota usa su propia muestra, sin transponer', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4
    await flush();

    expect(voice(62).play).toHaveBeenCalled();
    // La muestra de D♯4 no interviene: D4 ya no se apoya en ella.
    expect(voice(63).play).not.toHaveBeenCalled();
  });

  it('playNote sin load() lanza error', () => {
    const player = createExpoAudioPlayer();
    expect(() => player.playNote(60)).toThrow(/load\(\)/);
  });

  it('una voz en reposo suena de inmediato, sin rebobinar', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60);

    const c4 = voice(60);
    expect(c4.play).toHaveBeenCalled();
    expect(c4.seekTo).not.toHaveBeenCalled(); // ya estaba en la posición 0
  });

  it('al re-disparar una voz, rebobina ANTES de reproducir', async () => {
    // Regresión del bug de "nota incompleta": play() sin esperar el seekTo
    // arrancaba desde donde la voz había quedado, sin ataque.
    const player = createExpoAudioPlayer();
    await player.load();

    for (let i = 0; i < VOICES + 1; i += 1) player.playNote(60);
    await flush();

    const reused = voice(60, 0);
    expect(reused.pause).toHaveBeenCalled();
    expect(reused.seekTo).toHaveBeenCalledWith(0);
    expect(reused.play.mock.calls.length).toBeGreaterThanOrEqual(2);
    // El orden importa: el último seekTo se resolvió antes del último play.
    expect(reused.seekTo.mock.invocationCallOrder[0]).toBeLessThan(
      reused.play.mock.invocationCallOrder[1],
    );
  });

  it('no crea players en caliente: todas las voces se precargan en load()', async () => {
    const player = createExpoAudioPlayer();
    await player.load();
    const created = createAudioPlayer.mock.calls.length;

    player.playNote(62);
    player.playNote(64);
    player.playNote(60);
    await flush();

    expect(createAudioPlayer.mock.calls.length).toBe(created);
  });

  it('dos notas distintas suenan a la vez (pools independientes)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(62); // D4
    player.playNote(64); // E4
    await flush();

    expect(voice(62).playing).toBe(true); // la primera sigue sonando
    expect(voice(64).playing).toBe(true);
  });

  it('spamear la misma tecla reparte entre las voces del pool', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60);
    player.playNote(60);
    await flush();

    expect(voice(60, 0).play).toHaveBeenCalled();
    expect(voice(60, 1).play).toHaveBeenCalled();
  });

  it('corta la nota tras la duración máxima (no suena indefinidamente)', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60);
    const c4 = voice(60);
    expect(c4.playing).toBe(true);

    jest.advanceTimersByTime(2000); // supera MAX_NOTE_MS + fundido
    expect(c4.playing).toBe(false);
  });

  it('un fundido viejo no apaga una pulsación nueva', async () => {
    const player = createExpoAudioPlayer();
    await player.load();

    player.playNote(60);
    jest.advanceTimersByTime(JUST_BEFORE_FADE_MS);
    player.playNote(60); // vuelve a sonar mientras el fundido anterior corría
    await flush();
    jest.advanceTimersByTime(50);

    // La voz reutilizada no debe quedar a volumen 0 por el fundido descartado.
    const voices = [voice(60, 0), voice(60, 1)];
    expect(voices.some((v) => v.playing && v.volume === 1)).toBe(true);
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
    await flush();

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
