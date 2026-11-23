import { AudioContext } from 'react-native-audio-api';

import { NO_VOICE } from '@/domain/audio';
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
  /** Desde dónde de la muestra se empezó a leer (s). */
  offset?: number;
  stoppedAt?: number;
  onEnded?: () => void;
  start(when: number, offset?: number): void;
  stop(when: number): void;
  connect(): void;
  disconnect(): void;
}

const mockSources: FakeSource[] = [];
const mockGains: { ramps: RampCall[]; setValues: RampCall[] }[] = [];
/** Los nodos en sí, para poder leer la ganancia asignada directamente (`.value`). */
const mockGainNodes: { value: number }[] = [];

const mockDecodedIds: number[] = [];
/** Curvas asignadas al limitador (WaveShaper) del bus. */
const mockCurves: (Float32Array | null)[] = [];

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
    createWaveShaper = () => {
      const shaper = {
        set curve(value: Float32Array | null) {
          mockCurves.push(value);
        },
        connect: jest.fn(),
      };
      return shaper;
    };
    createBufferSource = () => {
      const source: FakeSource = {
        buffer: undefined,
        start(when: number, offset?: number) {
          this.startedAt = when;
          this.offset = offset;
        },
        stop(when: number) {
          // Como el motor nativo: parar un nodo que nunca arrancó lanza, y
          // dentro de un gesto eso cerraba la app.
          if (this.startedAt === undefined) {
            throw new Error('InvalidStateError: Cannot call stop without calling start first');
          }
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
const DAMPER_S = 0.06;

const newContext = () => new AudioContext();

beforeEach(() => {
  mockSources.length = 0;
  mockGains.length = 0;
  mockGainNodes.length = 0;
  mockDecodedIds.length = 0;
  mockCurves.length = 0;
  mockNow = 0;
});

async function loadedPlayer() {
  const player = createPianoSamplerPlayer(newContext);
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

  it('sin load() no suena pero tampoco lanza', () => {
    const player = createPianoSamplerPlayer(newContext);
    expect(player.noteOn(60)).toBe(NO_VOICE);
  });

  it('load() concurrente decodifica el banco una sola vez', async () => {
    const player = createPianoSamplerPlayer(newContext);

    await Promise.all([player.load(), player.load()]);

    // 25 muestras (C4–C6) decodificadas UNA vez, aunque load() se llame dos
    // veces antes de que la primera resuelva (remount de la tab inicial).
    // (No se comprueba que los ids sean distintos: bajo jest-expo todos los
    // assets se resuelven al mismo stub.)
    expect(mockDecodedIds).toHaveLength(PIANO_SAMPLES.length);
    // Y un único bus maestro, no uno por llamada.
    expect(mockGains).toHaveLength(1);
  });

  it('el bus maestro deja headroom fijo y nunca amplifica', async () => {
    await loadedPlayer();

    // Las muestras ya pican casi a 0 dBFS: una ganancia > 1 no tiene techo
    // digital y saturaría; sin headroom, la escala completa a la vez clavaba
    // el limitador de forma audible.
    const busGain = mockGainNodes[0].value;
    expect(busGain).toBeGreaterThan(0);
    expect(busGain).toBeLessThan(1);
  });

  it('un acorde de cuatro notas a fondo de escala nunca cae en el recorte duro', async () => {
    await loadedPlayer();

    // Un WaveShaper FIJA al extremo de su curva todo lo que sale de [-1, 1]:
    // eso es un recorte cuadrado, la "estática" de los acordes. Cuatro voces
    // con el pico en fase deben seguir dentro del dominio de la curva.
    const busGain = mockGainNodes[0].value;
    expect(4 * busGain).toBeLessThanOrEqual(1);

    // Y la curva nunca pasa del fondo de escala: el exceso se dobla suave.
    const curve = mockCurves[mockCurves.length - 1];
    expect(curve).not.toBeNull();
    const values = Array.from(curve ?? []);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1);
    // Monótona: más entrada nunca da menos salida (sin pliegues que suenen raro).
    expect(values.every((value, i) => i === 0 || value >= values[i - 1])).toBe(true);
  });

  it('cada nota se lee desde el inicio del archivo, que ya es su ataque', async () => {
    const player = await loadedPlayer();

    player.noteOn(60);

    // El silencio inicial se recorta al generar el banco, no al sonar: no hay
    // desplazamiento que calcular en el teléfono.
    expect(mockSources[0].offset ?? 0).toBe(0);
  });

  it('una nota de duración exacta arranca en el instante pedido', async () => {
    const player = await loadedPlayer();

    player.playTimed(60, 1000, 500);

    // Arranca en 1 s (el instante del golpe con el que se programó) y se
    // apaga con el apagador al acabar su duración.
    expect(mockSources[0].startedAt).toBeCloseTo(1, 6);
    expect(mockSources[0].stoppedAt).toBeCloseTo(1.5 + DAMPER_S, 6);
  });

  it('una nota de duración exacta no detiene el nodo antes de arrancarlo', async () => {
    const player = await loadedPlayer();

    // El motor nativo lanza si se llama stop() antes que start(): pasaba con
    // cada figura sobre el pulso y cerraba la app.
    expect(() => player.playTimed(60, 0, 500)).not.toThrow();
    expect(mockSources[0].startedAt).toBe(0);
    expect(mockSources[0].stoppedAt).toBeCloseTo(0.5 + DAMPER_S, 6);
  });

  it('cortar una nota programada que aún no suena no la deja sonar', async () => {
    const player = await loadedPlayer();

    const handle = player.playTimed(60, 2000, 500);
    mockNow = 0.5;
    player.noteOff(handle);

    // Se detiene en el instante en que iba a empezar: nunca llega a sonar.
    expect(mockSources[0].stoppedAt).toBeCloseTo(2, 6);
  });

  it('noteOff con un instante suelta la nota justo ahí', async () => {
    const player = await loadedPlayer();

    const handle = player.playTimed(60, 0, 4000);
    mockNow = 0.5;
    player.noteOff(handle, 1000);

    // Una redonda que debe callar en el próximo golpe (1 s), ni antes ni después.
    expect(mockSources[0].stoppedAt).toBeCloseTo(1 + DAMPER_S, 6);
  });

  it('noteOff con un instante posterior a su final no la alarga', async () => {
    const player = await loadedPlayer();

    const handle = player.playTimed(60, 0, 500);
    const stoppedAt = mockSources[0].stoppedAt;
    player.noteOff(handle, 1000);

    // Ya habrá callado sola: volver a programar su apagado la haría sonar de más.
    expect(mockSources[0].stoppedAt).toBe(stoppedAt);
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
