/**
 * Banco de muestras de piano CROMÁTICO: un archivo por semitono, C4–C6
 * (ver assets/audio/piano-chromatic/ y docs/credits/credits.md).
 *
 * Origen: Salamander Grand Piano (Yamaha C5), que viene muestreado cada 3
 * semitonos. Los semitonos intermedios se generan OFFLINE resampleando la
 * muestra más cercana como máximo ±1 semitono —práctica normal de un sampler—
 * con `scripts/build-piano-samples.mjs`.
 *
 * Por qué offline y no en el dispositivo:
 * transponer en caliente (`setPlaybackRate` de expo-audio) no se aplica desde la
 * muestra 0 —ExoPlayer lo propaga de forma asíncrona en su hilo—, así que las
 * notas intermedias arrancaban con la altura de la muestra cruda y "se corregían
 * solas" a mitad del ataque. Con el banco ya resampleado, el motor reproduce
 * SIEMPRE a rate 1 y esa clase de bug desaparece por construcción.
 *
 * Las muestras llevan además +7 dB y están recortadas a 4 s (con fundido final),
 * que es todo lo que la app puede llegar a usar.
 *
 * Metro exige `require()` con rutas literales, por eso la lista es explícita.
 */

export interface PianoSample {
  /** Altura MIDI de la muestra tal como fue grabada. */
  readonly midi: number;
  /** Asset resuelto por Metro (require devuelve un id numérico). */
  readonly source: number;
}

/**
 * Rango cubierto: C4 (60) a C6 (84), un archivo por semitono.
 *
 * Es exactamente lo que la Librería puede producir hoy: la tónica vive en la
 * octava 4 (C4–B4 = 60–71) y la fórmula más larga suma 12 semitonos (→ 83),
 * más C6 para cerrar la octava superior. Si algún día se agrega un selector de
 * octava, hay que extender este banco y las constantes de rango.
 */
export const PIANO_SAMPLES: readonly PianoSample[] = [
  { midi: 60, source: require('../../../assets/audio/piano-chromatic/C4.mp3') },
  { midi: 61, source: require('../../../assets/audio/piano-chromatic/Cs4.mp3') },
  { midi: 62, source: require('../../../assets/audio/piano-chromatic/D4.mp3') },
  { midi: 63, source: require('../../../assets/audio/piano-chromatic/Ds4.mp3') },
  { midi: 64, source: require('../../../assets/audio/piano-chromatic/E4.mp3') },
  { midi: 65, source: require('../../../assets/audio/piano-chromatic/F4.mp3') },
  { midi: 66, source: require('../../../assets/audio/piano-chromatic/Fs4.mp3') },
  { midi: 67, source: require('../../../assets/audio/piano-chromatic/G4.mp3') },
  { midi: 68, source: require('../../../assets/audio/piano-chromatic/Gs4.mp3') },
  { midi: 69, source: require('../../../assets/audio/piano-chromatic/A4.mp3') },
  { midi: 70, source: require('../../../assets/audio/piano-chromatic/As4.mp3') },
  { midi: 71, source: require('../../../assets/audio/piano-chromatic/B4.mp3') },
  { midi: 72, source: require('../../../assets/audio/piano-chromatic/C5.mp3') },
  { midi: 73, source: require('../../../assets/audio/piano-chromatic/Cs5.mp3') },
  { midi: 74, source: require('../../../assets/audio/piano-chromatic/D5.mp3') },
  { midi: 75, source: require('../../../assets/audio/piano-chromatic/Ds5.mp3') },
  { midi: 76, source: require('../../../assets/audio/piano-chromatic/E5.mp3') },
  { midi: 77, source: require('../../../assets/audio/piano-chromatic/F5.mp3') },
  { midi: 78, source: require('../../../assets/audio/piano-chromatic/Fs5.mp3') },
  { midi: 79, source: require('../../../assets/audio/piano-chromatic/G5.mp3') },
  { midi: 80, source: require('../../../assets/audio/piano-chromatic/Gs5.mp3') },
  { midi: 81, source: require('../../../assets/audio/piano-chromatic/A5.mp3') },
  { midi: 82, source: require('../../../assets/audio/piano-chromatic/As5.mp3') },
  { midi: 83, source: require('../../../assets/audio/piano-chromatic/B5.mp3') },
  { midi: 84, source: require('../../../assets/audio/piano-chromatic/C6.mp3') },
];

/** Rango reproducible: coincide con el banco, porque no hay transposición. */
export const MIN_PLAYABLE_MIDI = PIANO_SAMPLES[0].midi;
export const MAX_PLAYABLE_MIDI = PIANO_SAMPLES[PIANO_SAMPLES.length - 1].midi;

/**
 * Muestra exacta de una altura MIDI, o `undefined` si está fuera del banco.
 * No hay "muestra más cercana": si la nota no existe, no se reproduce nada
 * (preferible a sonar desafinada).
 */
export function sampleFor(midi: number): PianoSample | undefined {
  return PIANO_SAMPLES.find((sample) => sample.midi === midi);
}
