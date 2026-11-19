import { createMetronomePlayer } from '../MetronomePlayer';

interface FakeSource {
  startedAt?: number;
  stopped: boolean;
  start(when: number): void;
  stop(): void;
  connect(): void;
  disconnect(): void;
}

const mockSources: FakeSource[] = [];
/** Reloj de audio simulado (segundos): avanza con los timers falsos de Jest. */
let mockStartMs = 0;
const mockNow = () => 10 + (Date.now() - mockStartMs) / 1000;
let mockCopied: Float32Array | undefined;

jest.mock('react-native-audio-api', () => ({
  AudioContext: class {
    get currentTime() {
      return mockNow();
    }
    sampleRate = 48000;
    destination = {};
    createGain = () => ({ gain: { value: 1 }, connect: jest.fn() });
    createBuffer = () => ({
      copyToChannel: (data: Float32Array) => {
        mockCopied = data;
      },
    });
    createBufferSource = () => {
      const source: FakeSource = {
        stopped: false,
        start(when: number) {
          this.startedAt = when;
        },
        stop() {
          this.stopped = true;
        },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      mockSources.push(source);
      return source;
    };
  },
}));

beforeEach(() => {
  mockStartMs = Date.now();
  mockSources.length = 0;
  mockCopied = undefined;
});

describe('createMetronomePlayer', () => {
  it('antes de cargar no suena y devuelve null', () => {
    expect(createMetronomePlayer().play([0, 500])).toBeNull();
    expect(mockSources).toHaveLength(0);
  });

  it('sintetiza un golpe corto que no satura', async () => {
    await createMetronomePlayer().load();
    expect(mockCopied).toBeDefined();
    const peak = Math.max(...Array.from(mockCopied!, Math.abs));
    expect(peak).toBeGreaterThan(0.1);
    expect(peak).toBeLessThan(1);
  });

  it('programa cada golpe en el reloj de audio, separados exactamente', async () => {
    const player = createMetronomePlayer();
    await player.load();
    const start = player.play([0, 500, 1000]);

    expect(start).not.toBeNull();
    const times = mockSources.map((source) => source.startedAt!);
    expect(times[1] - times[0]).toBeCloseTo(0.5, 6);
    expect(times[2] - times[0]).toBeCloseTo(1, 6);
    // El primero sale con margen, nunca en el pasado.
    expect(times[0]).toBeGreaterThan(10);
  });

  it('volver a programar corta lo pendiente', async () => {
    const player = createMetronomePlayer();
    await player.load();
    player.play([0, 500]);
    const first = [...mockSources];
    player.play([0]);
    expect(first.every((source) => source.stopped)).toBe(true);
  });

  describe('pulso continuo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockStartMs = Date.now();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const startLoop = async (bpm: number) => {
      const player = createMetronomePlayer();
      await player.load();
      mockStartMs = Date.now();
      const beats: { index: number; accent: boolean }[] = [];
      const loop = player.loop({
        bpm,
        isAccent: (index) => index % 4 === 0,
        onBeat: (beat) => beats.push(beat),
      });
      return { player, loop, beats };
    };

    it('sigue programando golpes regulares y avisa de cada uno, con sus acentos', async () => {
      const { loop, beats } = await startLoop(120);
      expect(loop).not.toBeNull();
      jest.advanceTimersByTime(2600);

      const times = mockSources.map((source) => source.startedAt!);
      expect(times.length).toBeGreaterThanOrEqual(5);
      times.slice(1).forEach((time, index) => expect(time - times[index]).toBeCloseTo(0.5, 6));
      expect(beats.length).toBeGreaterThanOrEqual(5);
      expect(beats.slice(0, 5).map((beat) => beat.accent)).toEqual([
        true,
        false,
        false,
        false,
        true,
      ]);
    });

    it('cambiar el tempo en vivo cambia la distancia entre los golpes siguientes', async () => {
      const { loop } = await startLoop(60);
      jest.advanceTimersByTime(1500);
      loop!.setBpm(120);
      jest.advanceTimersByTime(3000);

      const times = mockSources.map((source) => source.startedAt!);
      const gaps = times.slice(1).map((time, index) => time - times[index]);
      expect(gaps[0]).toBeCloseTo(1, 6);
      expect(gaps[gaps.length - 1]).toBeCloseTo(0.5, 6);
    });

    it('detenerlo corta lo programado y no avisa más golpes', async () => {
      const { loop, beats } = await startLoop(120);
      jest.advanceTimersByTime(600);
      loop!.stop();
      const heard = beats.length;
      jest.advanceTimersByTime(3000);

      expect(beats).toHaveLength(heard);
      expect(mockSources.every((source) => source.stopped || source.startedAt! <= mockNow())).toBe(
        true,
      );
    });
  });
});
