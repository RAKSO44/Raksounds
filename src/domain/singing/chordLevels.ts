import { LevelTier } from '../ear-training';
import { SonorityId } from './chords';

/**
 * Niveles de "entonación de notas" (sacar una nota de lo que suena a la vez).
 *
 * La dificultad de este ejercicio NO es solo cuántas notas suenan. Pesan tres
 * cosas, y cada nivel sube una:
 * 1. Cuántas notas suenan (1 → 2 → 3 → 4).
 * 2. Si la nota pedida es extrema o interna: la más aguda y la más grave se
 *    oyen solas; las de en medio cuestan.
 * 3. Si la FUNCIÓN coincide con la POSICIÓN. En estado fundamental "la 3ª" es
 *    siempre "la de en medio", y se puede acertar por posición sin oír la
 *    función. Con inversiones (nivel 4) eso deja de valer: es el salto real de
 *    habilidad, por eso tiene nivel propio antes de añadir la 7ª.
 */

export interface ChordLevel {
  /** Número visible del nivel (1–5). Es también su identificador en las rutas. */
  readonly number: number;
  /** Sonoridades que pueden sonar en el nivel. */
  readonly sonorities: readonly SonorityId[];
  /** Si el acorde puede sonar invertido. */
  readonly inversions: boolean;
  /** Franja de dificultad; la UI la traduce a color. */
  readonly tier: LevelTier;
}

export const CHORD_LEVELS: readonly ChordLevel[] = [
  { number: 1, sonorities: ['single'], inversions: false, tier: 'easy' },
  {
    number: 2,
    sonorities: ['dyadMajorThird', 'dyadMinorThird', 'dyadFifth'],
    inversions: false,
    tier: 'easy',
  },
  { number: 3, sonorities: ['majorTriad', 'minorTriad'], inversions: false, tier: 'medium' },
  { number: 4, sonorities: ['majorTriad', 'minorTriad'], inversions: true, tier: 'hard' },
  {
    number: 5,
    sonorities: ['majorSeventh', 'minorSeventh', 'dominantSeventh'],
    inversions: false,
    tier: 'hard',
  },
];

/** Nivel por su número, o `null` si no existe (p. ej. un parámetro de ruta inválido). */
export function chordLevelByNumber(levelNumber: number): ChordLevel | null {
  return CHORD_LEVELS.find((level) => level.number === levelNumber) ?? null;
}
