import { NO_VOICE } from '@/domain/audio/IAudioPlayer';
import { volumeToGain } from '@/domain/audio/volume';
import { PIANO_SAMPLES } from '../pianoSampleMap';
import { createPianoSamplerPlayer } from '../PianoSamplerPlayer';

/**
 * Doble de react-native-audio-api. Registra lo que se agenda en cada nodo para
 * poder afirmar sobre la envolvente y sobre el ciclo de vida de las voces, que
 * es donde vivían los bugs del motor anterior.
 */

interface RampCall {
  readonly value: number;
  readonly time: number;
}

interface FakeSource {
  buffer: unknown;
  startedAt?: number;
  stoppedAt?: number;
  onEnded?: () => void;
  start(when: number): void;
  stop(when: number): void;
  connect(): void;
  disconnect(): void;
}

const mockSources: FakeSource[] = [];
const mockGains: { ramps: RampCall[]; setValues: RampCall[] }[] = [];
/** Los nodos en sí, para poder leer la ganancia asignada directamente (`.value`). */
const mockGainNodes: { value: number }[] = [];

const mockDecodedIds: number[] = [];

let mockNow = 0;

function mockCreateGain() {
  const record = { ramps: [] as RampCall[], setValues: [] as RampCall[] };
  mockGains.push(record);
  const gain = {
    value: 1,
    setValueAtTime: (value: number, time: number) => {
      record.setValues.push({ value, time });
      return gain;
    },
    linearRampToValueAtTime: (value: number, time: number) => {
      record.ramps.push({ value, time });
      return gain;
    },
    exponentialRampToValueAtTime: (value: number, time: number) => {
      record.ramps.push({ value, time });
      return gain;
    },
    cancelScheduledValues: () => gain,
  };
  mockGainNodes.push(gain);
  return { gain, connect: jest.fn(), disconnect: jest.fn(), __record: record };
}

jest.mock('react-native-audio-api', () => ({
  AudioContext: class {
    get currentTime() {
      return mockNow;
    }
    destination = {};
    createGain = mockCreateGain;
    createWaveShaper = () => ({ curve: null, connect: jest.fn() });
    createBufferSource = () => {
      const source: FakeSource = {
        buffer: undefined,
        start(when: number) {
          this.startedAt = when;
        },
        stop(when: number) {
          this.stoppedAt = when;
        },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      mockSources.push(source);
      return source;
    };
    decodeAudioData = async (id: number) => {
      mockDecodedIds.push(id);
      return { id };
    };
    close = jest.fn().mockResolvedValue(undefined);
  },
}));

/** Constantes del motor; deben coincidir con PianoSamplerPlayer.ts. */
const RELEASE_S = 0.7;
const MIN_SOUNDING_S = 1.5;

beforeEach(() => {
  mockSources.length = 0;
  mockGains.length = 0;
  mockGainNodes.length = 0;
  mockDecodedIds.length = 0;
  mockNow = 0;
});

async function loadedPlayer() {
  const player = createPianoSamplerPlayer();
  await player.load();
  mockSources.length = 0;
  mockGains.length = 0;
  return player;
}

describe('createPianoSamplerPlayer', () => {
  it('cada pulsación crea un nodo NUEVO en vez de reutilizar uno', async () => {
    const player = await loadedPlayer();

    player.noteOn(60);
    player.noteOn(60);
    player.noteOn(60);

    // Este es el arreglo de fondo: sin reutilización no hay nada que rebobinar,
    // así que no puede haber notas "empezadas" ni pulsaciones que se pierdan.
    expect(mockSources).toHaveLength(3);
    expect(new Set(mockSources).size).toBe(3);
    for (const source of mockSources) expect(source.startedAt).toBe(0);
  });

  it('todas las notas de una escala pueden sonar a la vez', async () => {
    const player = await loadedPlayer();

    // C mayor completa: 7 dedos es más de lo que nadie va a pulsar.
    const handles = [60, 62, 64, 65, 67, 69, 71].map((midi) => player.noteOn(midi));

    expect(new Set(handles).size).toBe(7);
    expect(handles).not.toContain(NO_VOICE);
    // Ninguna se detuvo al iniciarse otra: no hay pool que robe voces.
    expect(mockSources.filter((s) => s.stoppedAt !== undefined)).toHaveLength(0);
  });

  it('un toque instantáneo suena 1.5 s en total', async () => {
    const player = await loadedPlayer();

    const handle = player.noteOn(60);
    mockNow = 0.05; // se soltó casi de inmediato
    player.noteOff(handle);

    // La caída arranca en 0.8 s y termina en 1.5 s: el tap se oye completo en
    // vez de quedar en un chasquido de 50 ms.
    expect(mockSources[0].stoppedAt).toBeCloseTo(MIN_SOUNDING_S, 5);
    const fadeTo = mockGains[0].ramps.at(-1)!;
    expect(fadeTo.time).toBeCloseTo(MIN_SOUNDING_S, 5);
    expect(fadeTo.value).toBeLessThan(0.001);
  });

  it('una nota mantenida sigue sonando y cae 0.7 s tras soltarla', async () => {
    const player = await loadedPlayer();

    const handle = player.noteOn(60);
    mockNow = 3; // el dedo aguantó 3 segundos
    expect(mockSources[0].stoppedAt).toBeUndefined();

    player.noteOff(handle);

    expect(mockSources[0].stoppedAt).toBeCloseTo(3 + RELEASE_S, 5);
  });

  it('soltar dos veces la misma voz no reprograma nada', async () => {
    const player = await loadedPlayer();

    const handle = player.noteOn(60);
    mockNow = 2;
    player.noteOff(handle);
    const stoppedAt = mockSources[0].stoppedAt;

    mockNow = 2.1;
    player.noteOff(handle);

    // Idempotente: un gesto que finaliza dos veces (cancelación + soltado) no
    // debe acortar ni alargar la caída ya programada.
    expect(mockSources[0].stoppedAt).toBe(stoppedAt);
  });

  it('soltar una voz desconocida no lanza', async () => {
    const player = await loadedPlayer();
    expect(() => player.noteOff(999)).not.toThrow();
    expect(() => player.noteOff(NO_VOICE)).not.toThrow();
  });

  it('una nota fuera del banco devuelve NO_VOICE sin lanzar', async () => {
    const player = await loadedPlayer();

    // Se llama desde un gesto: lanzar dejaría el botón a medio pulsar.
    expect(player.noteOn(20)).toBe(NO_VOICE);
    expect(player.noteOn(110)).toBe(NO_VOICE);
    expect(mockSources).toHaveLength(0);
  });

  it('el volumen fijado antes de load() se aplica al crear el bus', async () => {
    const player = createPianoSamplerPlayer();

    player.setVolume(1);
    await player.load();

    // El primer gain que se crea es el bus maestro.
    expect(mockGainNodes[0].value).toBeCloseTo(volumeToGain(1), 5);
  });

  it('cambiar el volumen rampa la ganancia del bus en vez de saltar', async () => {
    const player = createPianoSamplerPlayer();
    await player.load();
    const master = mockGains[0];

    mockNow = 5;
    player.setVolume(0.25);

    const ramp = master.ramps.at(-1)!;
    expect(ramp.value).toBeCloseTo(volumeToGain(0.25), 5);
    // Sin la rampa, mover el deslizable con notas sonando produciría un click.
    expect(ramp.time).toBeGreaterThan(mockNow);
  });

  it('bajar el volumen a cero silencia el bus', async () => {
    const player = createPianoSamplerPlayer();
    await player.load();

    player.setVolume(0);

    expect(mockGains[0].ramps.at(-1)!.value).toBe(0);
  });

  it('fijar el volumen sin load() no lanza', () => {
    const player = createPianoSamplerPlayer();
    expect(() => player.setVolume(0.8)).not.toThrow();
  });

  it('sin load() no suena pero tampoco lanza', () => {
    const player = createPianoSamplerPlayer();
    expect(player.noteOn(60)).toBe(NO_VOICE);
  });

  it('load() concurrente decodifica el banco una sola vez', async () => {
    const player = createPianoSamplerPlayer();

    await Promise.all([player.load(), player.load()]);

    // 25 muestras (C4–C6) decodificadas UNA vez, aunque load() se llame dos
    // veces antes de que la primera resuelva (remount de la tab inicial).
    // (No se comprueba que los ids sean distintos: bajo jest-expo todos los
    // assets se resuelven al mismo stub.)
    expect(mockDecodedIds).toHaveLength(PIANO_SAMPLES.length);
    // Y un único bus maestro, no uno por llamada.
    expect(mockGains).toHaveLength(1);
  });

  it('stopAll libera todas las voces en curso', async () => {
    const player = await loadedPlayer();

    player.noteOn(60);
    player.noteOn(64);
    mockNow = 5;
    player.stopAll();

    for (const source of mockSources) expect(source.stoppedAt).toBeDefined();
  });

  it('una voz que termina sola deja de estar registrada', async () => {
    const player = await loadedPlayer();

    const handle = player.noteOn(60);
    // El dedo aguantó más que la muestra: el nodo terminó por su cuenta.
    mockSources[0].onEnded?.();
    mockNow = 10;

    // No debe intentar detener un nodo ya muerto.
    expect(() => player.noteOff(handle)).not.toThrow();
    expect(mockSources[0].stoppedAt).toBeUndefined();
  });
});
