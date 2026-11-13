import {
  detectPitch,
  frequencyToMidi,
  midiToFrequency,
  normalizedLevel,
  rms,
  VOICE_RMS_THRESHOLD,
} from '../pitchDetection';

const SAMPLE_RATE = 44100;
const BLOCK = 2048;

function sine(frequency: number, amplitude = 0.5, sampleRate = SAMPLE_RATE): Float32Array {
  const samples = new Float32Array(BLOCK);
  for (let i = 0; i < BLOCK; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return samples;
}

/** Onda "vocal": fundamental débil y armónicos fuertes, el caso que engaña a un detector por espectro. */
function voiceLike(frequency: number): Float32Array {
  const samples = new Float32Array(BLOCK);
  for (let i = 0; i < BLOCK; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] =
      0.15 * Math.sin(2 * Math.PI * frequency * t) +
      0.3 * Math.sin(2 * Math.PI * 2 * frequency * t) +
      0.2 * Math.sin(2 * Math.PI * 3 * frequency * t);
  }
  return samples;
}

function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe('detectPitch', () => {
  it.each([110, 196, 261.63, 440, 880])(
    'detecta una senoidal de %p Hz con error < 5 cents',
    (hz) => {
      const estimate = detectPitch(sine(hz), SAMPLE_RATE);
      expect(estimate).not.toBeNull();
      expect(Math.abs(centsBetween(estimate!.frequency, hz))).toBeLessThan(5);
    },
  );

  it('encuentra la fundamental aunque los armónicos pesen más (sin error de octava)', () => {
    const estimate = detectPitch(voiceLike(220), SAMPLE_RATE);
    expect(Math.abs(centsBetween(estimate!.frequency, 220))).toBeLessThan(5);
  });

  it('funciona también a 48 kHz', () => {
    const estimate = detectPitch(sine(330, 0.5, 48000), 48000);
    expect(Math.abs(centsBetween(estimate!.frequency, 330))).toBeLessThan(5);
  });

  it('devuelve null en silencio', () => {
    expect(detectPitch(new Float32Array(BLOCK), SAMPLE_RATE)).toBeNull();
    expect(detectPitch(sine(440, VOICE_RMS_THRESHOLD / 2), SAMPLE_RATE)).toBeNull();
  });

  it('devuelve null con ruido blanco', () => {
    let seed = 7;
    const noise = new Float32Array(BLOCK).map(() => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return (seed / 2 ** 31) * 2 - 1;
    });
    expect(detectPitch(noise, SAMPLE_RATE)).toBeNull();
  });

  it('devuelve null si el bloque no alcanza para dos períodos del tono más grave', () => {
    expect(detectPitch(sine(440).slice(0, 256), SAMPLE_RATE)).toBeNull();
  });
});

describe('conversiones', () => {
  it('La4 = 440 Hz = MIDI 69', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69);
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('una octava son 12 semitonos', () => {
    expect(frequencyToMidi(220)).toBeCloseTo(57);
  });

  it('rms de una senoidal es amplitud/√2', () => {
    expect(rms(sine(440, 1))).toBeCloseTo(Math.SQRT1_2, 2);
    expect(rms([])).toBe(0);
  });
});

describe('normalizedLevel', () => {
  it('silencio es 0 y un grito satura en 1', () => {
    expect(normalizedLevel(0)).toBe(0);
    expect(normalizedLevel(0.0001)).toBe(0);
    expect(normalizedLevel(1)).toBe(1);
  });

  it('crece en decibelios: -30 dBFS queda a mitad de recorrido', () => {
    expect(normalizedLevel(10 ** (-30 / 20))).toBeCloseTo(0.5);
  });
});
