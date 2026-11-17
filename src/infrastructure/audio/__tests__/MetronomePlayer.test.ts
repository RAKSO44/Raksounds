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
let mockCopied: Float32Array | undefined;

jest.mock('react-native-audio-api', () => ({
  AudioContext: class {
    currentTime = 10;
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
});
