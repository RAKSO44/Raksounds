/**
 * Banco de muestras de piano (Salamander Grand Piano, ver assets/audio/piano/CREDITS.md).
 *
 * Muestreado cada tercera menor (C, D♯, F♯, A por octava) de C2 a C7.
 * Las notas intermedias se reproducen afinando la muestra más cercana con
 * playback rate (máximo ±1 semitono, artefacto inaudible en piano).
 *
 * Metro exige `require()` con rutas literales, por eso la lista es explícita.
 */

export interface PianoSample {
  /** Altura MIDI de la muestra tal como fue grabada. */
  readonly midi: number;
  /** Asset resuelto por Metro (require devuelve un id numérico). */
  readonly source: number;
}

/** Ordenado por MIDI ascendente. C2 = 36 … C7 = 96. */
export const PIANO_SAMPLES: readonly PianoSample[] = [
  { midi: 36, source: require('../../../assets/audio/piano/C2.mp3') },
  { midi: 39, source: require('../../../assets/audio/piano/Ds2.mp3') },
  { midi: 42, source: require('../../../assets/audio/piano/Fs2.mp3') },
  { midi: 45, source: require('../../../assets/audio/piano/A2.mp3') },
  { midi: 48, source: require('../../../assets/audio/piano/C3.mp3') },
  { midi: 51, source: require('../../../assets/audio/piano/Ds3.mp3') },
  { midi: 54, source: require('../../../assets/audio/piano/Fs3.mp3') },
  { midi: 57, source: require('../../../assets/audio/piano/A3.mp3') },
  { midi: 60, source: require('../../../assets/audio/piano/C4.mp3') },
  { midi: 63, source: require('../../../assets/audio/piano/Ds4.mp3') },
  { midi: 66, source: require('../../../assets/audio/piano/Fs4.mp3') },
  { midi: 69, source: require('../../../assets/audio/piano/A4.mp3') },
  { midi: 72, source: require('../../../assets/audio/piano/C5.mp3') },
  { midi: 75, source: require('../../../assets/audio/piano/Ds5.mp3') },
  { midi: 78, source: require('../../../assets/audio/piano/Fs5.mp3') },
  { midi: 81, source: require('../../../assets/audio/piano/A5.mp3') },
  { midi: 84, source: require('../../../assets/audio/piano/C6.mp3') },
  { midi: 87, source: require('../../../assets/audio/piano/Ds6.mp3') },
  { midi: 90, source: require('../../../assets/audio/piano/Fs6.mp3') },
  { midi: 93, source: require('../../../assets/audio/piano/A6.mp3') },
  { midi: 96, source: require('../../../assets/audio/piano/C7.mp3') },
];

/** Rango reproducible: fuera de esto la afinación excedería ±1 semitono. */
export const MIN_PLAYABLE_MIDI = PIANO_SAMPLES[0].midi - 1;
export const MAX_PLAYABLE_MIDI = PIANO_SAMPLES[PIANO_SAMPLES.length - 1].midi + 1;

/** Muestra más cercana a una altura MIDI dada. */
export function nearestSample(midi: number): PianoSample {
  let best = PIANO_SAMPLES[0];
  for (const sample of PIANO_SAMPLES) {
    if (Math.abs(sample.midi - midi) < Math.abs(best.midi - midi)) {
      best = sample;
    }
  }
  return best;
}

/** Rate de reproducción para sonar `midi` usando `sample`: 2^(Δ/12). */
export function playbackRateFor(midi: number, sample: PianoSample): number {
  return Math.pow(2, (midi - sample.midi) / 12);
}
