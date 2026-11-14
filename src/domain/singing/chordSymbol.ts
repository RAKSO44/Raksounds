import { formatNoteName } from '../music-theory';
import { SonorityId } from './chords';
import { ChordSingingExercise } from './singingGenerator';

/**
 * Sufijo del cifrado americano de cada sonoridad (C, Cm, Cmaj7…). Las díadas no
 * tienen cifrado propio: se nombran por sus dos notas (ver `chordSymbol`).
 */
const QUALITY_SUFFIX: Record<SonorityId, string | null> = {
  single: '',
  dyadMajorThird: null,
  dyadMinorThird: null,
  dyadFifth: null,
  majorTriad: '',
  minorTriad: 'm',
  majorSeventh: 'maj7',
  minorSeventh: 'm7',
  dominantSeventh: '7',
};

/**
 * Nombre de lo que suena en un ejercicio de entonación de notas.
 *
 * - Una nota: su nombre ("E♭").
 * - Díada: sus dos notas de grave a agudo ("C–E").
 * - Acorde: cifrado americano, y si está invertido, con el bajo tras una barra
 *   ("C/E" = Do mayor con la 3ª en el bajo).
 */
export function chordSymbol(exercise: ChordSingingExercise): string {
  const suffix = QUALITY_SUFFIX[exercise.sonority];
  if (suffix === null)
    return exercise.tones.map((tone) => formatNoteName(tone.note.name)).join('–');

  const name = formatNoteName(exercise.root) + suffix;
  if (exercise.inversion === 0) return name;
  // `tones` va de grave a agudo: la primera es el bajo.
  return `${name}/${formatNoteName(exercise.tones[0].note.name)}`;
}
