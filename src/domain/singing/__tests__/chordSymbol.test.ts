import { NoteName } from '../../music-theory';
import { chordSymbol } from '../chordSymbol';
import { SonorityId, voiceChord } from '../chords';
import { ChordSingingExercise } from '../singingGenerator';

const C: NoteName = { letter: 'C', accidental: 0 };
const E_FLAT: NoteName = { letter: 'E', accidental: -1 };

function exercise(root: NoteName, sonority: SonorityId, inversion = 0): ChordSingingExercise {
  const tones = voiceChord(root, 4, sonority, inversion);
  return {
    kind: 'singNote',
    root,
    rootOctave: 4,
    rootMidi: tones[0].midi,
    target: tones[0].note,
    targetMidi: tones[0].midi,
    sonority,
    inversion,
    tones,
    targetFunction: 'root',
  };
}

describe('chordSymbol', () => {
  it('una nota sola se nombra a sí misma', () => {
    expect(chordSymbol(exercise(E_FLAT, 'single'))).toBe('E♭');
  });

  it('una díada se nombra por sus dos notas, de grave a agudo', () => {
    expect(chordSymbol(exercise(C, 'dyadMajorThird'))).toBe('C–E');
    expect(chordSymbol(exercise(E_FLAT, 'dyadMinorThird'))).toBe('E♭–G♭');
  });

  it('cifrado americano de tríadas y cuatríadas', () => {
    expect(chordSymbol(exercise(C, 'majorTriad'))).toBe('C');
    expect(chordSymbol(exercise(C, 'minorTriad'))).toBe('Cm');
    expect(chordSymbol(exercise(C, 'majorSeventh'))).toBe('Cmaj7');
    expect(chordSymbol(exercise(C, 'minorSeventh'))).toBe('Cm7');
    expect(chordSymbol(exercise(E_FLAT, 'dominantSeventh'))).toBe('E♭7');
  });

  it('las inversiones llevan el bajo tras la barra', () => {
    expect(chordSymbol(exercise(C, 'majorTriad', 1))).toBe('C/E');
    expect(chordSymbol(exercise(C, 'minorTriad', 2))).toBe('Cm/G');
    expect(chordSymbol(exercise(E_FLAT, 'minorTriad', 1))).toBe('E♭m/G♭');
  });
});
