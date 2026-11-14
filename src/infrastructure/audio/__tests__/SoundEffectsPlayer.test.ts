import { createSoundEffectsPlayer } from '../SoundEffectsPlayer';

interface FakeSource {
  buffer: unknown;
  startedAt?: number;
  start(when: number): void;
  connect(): void;
  disconnect(): void;
}

const mockSources: FakeSource[] = [];
const mockGains: { value: number }[] = [];
let mockDecodeCalls = 0;
let mockFailDecode = false;

jest.mock('react-native-audio-api', () => ({
  AudioContext: class {
    currentTime = 2;
    destination = {};
    createGain = () => {
      const gain = { value: 1 };
      mockGains.push(gain);
      return { gain, connect: jest.fn() };
    };
    createBufferSource = () => {
      const source: FakeSource = {
        buffer: undefined,
        start(when: number) {
          this.startedAt = when;
        },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      mockSources.push(source);
      return source;
    };
    decodeAudioData = async (id: number) => {
      mockDecodeCalls += 1;
      if (mockFailDecode) throw new Error('decode');
      return { id };
    };
  },
}));

beforeEach(() => {
  mockSources.length = 0;
  mockGains.length = 0;
  mockDecodeCalls = 0;
  mockFailDecode = false;
});

describe('createSoundEffectsPlayer', () => {
  it('antes de cargar, play no suena ni lanza', () => {
    const effects = createSoundEffectsPlayer();
    expect(() => effects.play('success')).not.toThrow();
    expect(mockSources).toHaveLength(0);
  });

  it('decodifica los cuatro efectos una sola vez aunque load se llame dos veces', async () => {
    const effects = createSoundEffectsPlayer();
    await Promise.all([effects.load(), effects.load()]);
    expect(mockDecodeCalls).toBe(4);
  });

  it('cada disparo es un nodo nuevo que arranca ya', async () => {
    const effects = createSoundEffectsPlayer();
    await effects.load();

    effects.play('success');
    effects.play('success');

    expect(mockSources).toHaveLength(2);
    expect(mockSources[0]).not.toBe(mockSources[1]);
    expect(mockSources.every((source) => source.startedAt === 2)).toBe(true);
  });

  it('no amplifica: los efectos van por debajo del fondo de escala', async () => {
    const effects = createSoundEffectsPlayer();
    await effects.load();
    expect(mockGains[0].value).toBeLessThanOrEqual(1);
  });

  it('si la carga falla, se puede reintentar', async () => {
    mockFailDecode = true;
    const effects = createSoundEffectsPlayer();
    await effects.load();
    effects.play('error');
    expect(mockSources).toHaveLength(0);

    mockFailDecode = false;
    await effects.load();
    effects.play('error');
    expect(mockSources).toHaveLength(1);
  });
});
