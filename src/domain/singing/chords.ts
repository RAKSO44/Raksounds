import { Note, NoteName, noteToMidi, spellFromRoot } from '../music-theory';

/**
 * Sonoridades del ejercicio "entonación de notas": lo que suena A LA VEZ y de
 * lo que hay que sacar una nota cantándola.
 *
 * Cada nota de una sonoridad se identifica por su FUNCIÓN (fundamental, 3ª, 5ª,
 * 7ª), no por su posición: con inversiones la fundamental deja de ser la más
 * grave, y oír eso es justamente lo que entrenan los niveles altos.
 */

export type ChordFunction = 'root' | 'third' | 'fifth' | 'seventh';

export type SonorityId =
  /** Una sola nota: cantarla igual (unísono). */
  | 'single'
  | 'dyadMajorThird'
  | 'dyadMinorThird'
  | 'dyadFifth'
  | 'majorTriad'
  | 'minorTriad'
  | 'majorSeventh'
  | 'minorSeventh'
  | 'dominantSeventh';

export interface ChordToneSpec {
  readonly fn: ChordFunction;
  /** Semitonos sobre la fundamental en estado fundamental. */
  readonly semitones: number;
}

/**
 * Letras que avanza cada función desde la fundamental (una 3ª avanza 2): de aquí
 * sale el deletreo correcto, p. ej. que la 3ª menor de E♭ sea G♭ y no F♯.
 */
const LETTER_STEPS: Record<ChordFunction, number> = {
  root: 0,
  third: 2,
  fifth: 4,
  seventh: 6,
};

const ROOT: ChordToneSpec = { fn: 'root', semitones: 0 };
const MAJOR_THIRD: ChordToneSpec = { fn: 'third', semitones: 4 };
const MINOR_THIRD: ChordToneSpec = { fn: 'third', semitones: 3 };
const PERFECT_FIFTH: ChordToneSpec = { fn: 'fifth', semitones: 7 };

export const SONORITIES: Record<SonorityId, readonly ChordToneSpec[]> = {
  single: [ROOT],
  dyadMajorThird: [ROOT, MAJOR_THIRD],
  dyadMinorThird: [ROOT, MINOR_THIRD],
  dyadFifth: [ROOT, PERFECT_FIFTH],
  majorTriad: [ROOT, MAJOR_THIRD, PERFECT_FIFTH],
  minorTriad: [ROOT, MINOR_THIRD, PERFECT_FIFTH],
  majorSeventh: [ROOT, MAJOR_THIRD, PERFECT_FIFTH, { fn: 'seventh', semitones: 11 }],
  minorSeventh: [ROOT, MINOR_THIRD, PERFECT_FIFTH, { fn: 'seventh', semitones: 10 }],
  dominantSeventh: [ROOT, MAJOR_THIRD, PERFECT_FIFTH, { fn: 'seventh', semitones: 10 }],
};

/** Una nota concreta del acorde ya colocado en el teclado. */
export interface ChordTone {
  readonly fn: ChordFunction;
  readonly midi: number;
  /** Deletreo con octava ("G♭4"). */
  readonly note: Note;
}

/**
 * Rango del banco de muestras de piano (C4–C6). Un acorde se coloca siempre
 * dentro de él para que todas sus notas puedan sonar.
 */
export const CHORD_LOWEST_MIDI = 60;
export const CHORD_HIGHEST_MIDI = 84;

/**
 * Coloca una sonoridad en el teclado, de grave a agudo.
 *
 * `inversion` es cuántas notas de abajo suben una octava: 0 = estado
 * fundamental, 1 = primera inversión (la 3ª en el bajo)… Después, si el acorde
 * se sale por arriba del banco, se baja entero una octava (en posición cerrada
 * un acorde nunca abarca más de 12 semitonos, así que siempre cabe).
 */
export function voiceChord(
  root: NoteName,
  rootOctave: number,
  sonority: SonorityId,
  inversion: number,
): readonly ChordTone[] {
  const specs = SONORITIES[sonority];
  const raised = specs.map((spec, index) => ({ spec, octaves: index < inversion ? 1 : 0 }));

  const rootMidi = noteToMidi({ name: root, octave: rootOctave });
  const highest = Math.max(
    ...raised.map(({ spec, octaves }) => rootMidi + spec.semitones + 12 * octaves),
  );
  const shift = highest > CHORD_HIGHEST_MIDI ? -1 : 0;

  return raised
    .map(({ spec, octaves }) => {
      const totalOctaves = octaves + shift;
      const semitones = spec.semitones + 12 * totalOctaves;
      const note = spellFromRoot(
        root,
        rootOctave,
        LETTER_STEPS[spec.fn] + 7 * totalOctaves,
        semitones,
      );
      // Con las 12 tónicas de la app y estas fórmulas nunca hace falta más de
      // una doble alteración; si pasara, el error es del catálogo, no del usuario.
      if (note === null) throw new Error(`No se puede deletrear ${spec.fn} de ${sonority}`);
      return { fn: spec.fn, midi: rootMidi + semitones, note };
    })
    .sort((a, b) => a.midi - b.midi);
}

/**
 * Posiciones posibles de una sonoridad (estado fundamental + inversiones): una
 * por nota, porque cualquiera de ellas puede quedar en el bajo.
 */
export function positionCount(sonority: SonorityId): number {
  return SONORITIES[sonority].length;
}
