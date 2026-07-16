import {
  MAX_PLAYABLE_MIDI,
  MIN_PLAYABLE_MIDI,
  nearestSample,
  PIANO_SAMPLES,
  playbackRateFor,
} from '../pianoSampleMap';

describe('PIANO_SAMPLES', () => {
  it('está ordenado por MIDI ascendente y espaciado en terceras menores', () => {
    for (let i = 1; i < PIANO_SAMPLES.length; i++) {
      expect(PIANO_SAMPLES[i].midi - PIANO_SAMPLES[i - 1].midi).toBe(3);
    }
  });

  it('cubre C2 (36) a C7 (96)', () => {
    expect(PIANO_SAMPLES[0].midi).toBe(36);
    expect(PIANO_SAMPLES[PIANO_SAMPLES.length - 1].midi).toBe(96);
  });
});

describe('nearestSample', () => {
  it('una altura que coincide con una muestra usa esa muestra', () => {
    expect(nearestSample(60).midi).toBe(60); // C4
  });

  it('las alturas intermedias quedan a lo sumo a 1 semitono de la muestra', () => {
    for (let midi = MIN_PLAYABLE_MIDI; midi <= MAX_PLAYABLE_MIDI; midi++) {
      expect(Math.abs(nearestSample(midi).midi - midi)).toBeLessThanOrEqual(1);
    }
  });
});

describe('playbackRateFor', () => {
  it('sin desplazamiento el rate es 1', () => {
    expect(playbackRateFor(60, { midi: 60, source: 0 })).toBe(1);
  });

  it('un semitono arriba/abajo es 2^(±1/12)', () => {
    expect(playbackRateFor(61, { midi: 60, source: 0 })).toBeCloseTo(1.0595, 4);
    expect(playbackRateFor(59, { midi: 60, source: 0 })).toBeCloseTo(0.9439, 4);
  });
});
