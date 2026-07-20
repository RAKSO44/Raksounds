import {
  MAX_PLAYABLE_MIDI,
  MIN_PLAYABLE_MIDI,
  PIANO_SAMPLES,
  sampleFor,
} from '../pianoSampleMap';

describe('PIANO_SAMPLES', () => {
  it('es cromático: una muestra por semitono, sin huecos', () => {
    for (let i = 1; i < PIANO_SAMPLES.length; i++) {
      expect(PIANO_SAMPLES[i].midi - PIANO_SAMPLES[i - 1].midi).toBe(1);
    }
  });

  it('cubre C4 (60) a C6 (84)', () => {
    expect(PIANO_SAMPLES[0].midi).toBe(60);
    expect(PIANO_SAMPLES[PIANO_SAMPLES.length - 1].midi).toBe(84);
    expect(PIANO_SAMPLES).toHaveLength(25);
  });

  // Que cada muestra sea un archivo distinto NO se puede testear aquí:
  // jest-expo stubea todos los require() de assets al mismo id numérico.
  // Se verifica sobre los archivos reales (md5sum de assets/audio/piano-chromatic).

  it('el rango reproducible coincide con el banco (no hay transposición)', () => {
    expect(MIN_PLAYABLE_MIDI).toBe(60);
    expect(MAX_PLAYABLE_MIDI).toBe(84);
  });
});

describe('sampleFor', () => {
  it('toda altura del rango tiene su muestra EXACTA', () => {
    // Es la garantía que elimina el bug de afinación: si cada nota tiene su
    // propia grabación, nunca hay que tocar el playback rate.
    for (let midi = MIN_PLAYABLE_MIDI; midi <= MAX_PLAYABLE_MIDI; midi++) {
      expect(sampleFor(midi)?.midi).toBe(midi);
    }
  });

  it('fuera del rango no devuelve muestra', () => {
    expect(sampleFor(MIN_PLAYABLE_MIDI - 1)).toBeUndefined();
    expect(sampleFor(MAX_PLAYABLE_MIDI + 1)).toBeUndefined();
  });
});
