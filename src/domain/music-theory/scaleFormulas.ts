/**
 * Fórmulas de escalas y arpegios.
 *
 * Cada fórmula define dos cosas en paralelo:
 * - `semitones`: distancia de cada grado a la tónica (la altura que suena).
 * - `letterSteps`: cuántas letras avanza cada grado respecto a la tónica
 *   (el deletreo). En una escala de 7 notas cada grado avanza una letra;
 *   en un arpegio los grados son 1-3-5-8, es decir letras 0, 2, 4 y 7.
 *
 * Con ambas, el builder puede deletrear correctamente cualquier tonalidad
 * (E♭ mayor usa B♭, no A♯) sin casos especiales.
 */

export type ScaleType =
  | 'major'
  | 'naturalMinor'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'majorArpeggio'
  | 'minorArpeggio';

export type FormulaKind = 'scale' | 'arpeggio';

export interface ScaleFormula {
  readonly type: ScaleType;
  readonly kind: FormulaKind;
  readonly semitones: readonly number[];
  readonly letterSteps: readonly number[];
}

const SCALE_LETTER_STEPS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
const ARPEGGIO_LETTER_STEPS: readonly number[] = [0, 2, 4, 7];

export const SCALE_FORMULAS: Record<ScaleType, ScaleFormula> = {
  major: {
    type: 'major',
    kind: 'scale',
    semitones: [0, 2, 4, 5, 7, 9, 11],
    letterSteps: SCALE_LETTER_STEPS,
  },
  naturalMinor: {
    type: 'naturalMinor',
    kind: 'scale',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    letterSteps: SCALE_LETTER_STEPS,
  },
  harmonicMinor: {
    type: 'harmonicMinor',
    kind: 'scale',
    semitones: [0, 2, 3, 5, 7, 8, 11],
    letterSteps: SCALE_LETTER_STEPS,
  },
  // Variante ascendente; la descendente coincide con la menor natural.
  melodicMinor: {
    type: 'melodicMinor',
    kind: 'scale',
    semitones: [0, 2, 3, 5, 7, 9, 11],
    letterSteps: SCALE_LETTER_STEPS,
  },
  majorArpeggio: {
    type: 'majorArpeggio',
    kind: 'arpeggio',
    semitones: [0, 4, 7, 12],
    letterSteps: ARPEGGIO_LETTER_STEPS,
  },
  minorArpeggio: {
    type: 'minorArpeggio',
    kind: 'arpeggio',
    semitones: [0, 3, 7, 12],
    letterSteps: ARPEGGIO_LETTER_STEPS,
  },
};

export const ALL_SCALE_TYPES: readonly ScaleType[] = [
  'major',
  'naturalMinor',
  'harmonicMinor',
  'melodicMinor',
  'majorArpeggio',
  'minorArpeggio',
];
