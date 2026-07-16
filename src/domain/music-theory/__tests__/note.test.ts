import {
  CHROMATIC_ROOTS,
  formatNote,
  formatNoteName,
  midiOctave,
  midiPitchClass,
  noteToMidi,
  pitchClassOf,
  spellPitchClass,
  transpose,
} from '../note';

describe('noteToMidi', () => {
  it('C4 (do central) es MIDI 60', () => {
    expect(noteToMidi({ name: { letter: 'C', accidental: 0 }, octave: 4 })).toBe(60);
  });

  it('A4 es MIDI 69', () => {
    expect(noteToMidi({ name: { letter: 'A', accidental: 0 }, octave: 4 })).toBe(69);
  });

  it('las alteraciones desplazan la altura: C♯4 = 61, C♭4 = 59', () => {
    expect(noteToMidi({ name: { letter: 'C', accidental: 1 }, octave: 4 })).toBe(61);
    expect(noteToMidi({ name: { letter: 'C', accidental: -1 }, octave: 4 })).toBe(59);
  });

  it('la octava pertenece a la letra: B♯3 suena como C4 (MIDI 60)', () => {
    expect(noteToMidi({ name: { letter: 'B', accidental: 1 }, octave: 3 })).toBe(60);
  });

  it('enarmonías: E♭4 y D♯4 tienen la misma altura', () => {
    const eFlat = noteToMidi({ name: { letter: 'E', accidental: -1 }, octave: 4 });
    const dSharp = noteToMidi({ name: { letter: 'D', accidental: 1 }, octave: 4 });
    expect(eFlat).toBe(dSharp);
  });
});

describe('pitchClassOf', () => {
  it('deletreos enarmónicos comparten clase de altura', () => {
    expect(pitchClassOf({ letter: 'E', accidental: -1 })).toBe(3);
    expect(pitchClassOf({ letter: 'D', accidental: 1 })).toBe(3);
  });

  it('envuelve en los extremos: C♭ = 11, B♯ = 0', () => {
    expect(pitchClassOf({ letter: 'C', accidental: -1 })).toBe(11);
    expect(pitchClassOf({ letter: 'B', accidental: 1 })).toBe(0);
  });
});

describe('midiPitchClass / midiOctave', () => {
  it('descompone MIDI 60 en clase 0, octava 4', () => {
    expect(midiPitchClass(60)).toBe(0);
    expect(midiOctave(60)).toBe(4);
  });

  it('MIDI 69 (A4) es clase 9, octava 4', () => {
    expect(midiPitchClass(69)).toBe(9);
    expect(midiOctave(69)).toBe(4);
  });
});

describe('transpose', () => {
  it('suma semitonos sobre la altura canónica', () => {
    expect(transpose(60, 7)).toBe(67);
    expect(transpose(60, -12)).toBe(48);
  });
});

describe('formato', () => {
  it('formatea alteraciones con símbolos musicales', () => {
    expect(formatNoteName({ letter: 'C', accidental: 0 })).toBe('C');
    expect(formatNoteName({ letter: 'F', accidental: 1 })).toBe('F♯');
    expect(formatNoteName({ letter: 'B', accidental: -1 })).toBe('B♭');
    expect(formatNoteName({ letter: 'F', accidental: 2 })).toBe('F♯♯');
    expect(formatNoteName({ letter: 'E', accidental: -2 })).toBe('E♭♭');
  });

  it('formatNote incluye la octava', () => {
    expect(formatNote({ name: { letter: 'E', accidental: -1 }, octave: 4 })).toBe('E♭4');
  });
});

describe('spellPitchClass', () => {
  it('respeta la preferencia de alteración', () => {
    expect(spellPitchClass(3, 'sharp')).toEqual({ letter: 'D', accidental: 1 });
    expect(spellPitchClass(3, 'flat')).toEqual({ letter: 'E', accidental: -1 });
  });

  it('las notas naturales no cambian con la preferencia', () => {
    expect(spellPitchClass(0, 'sharp')).toEqual({ letter: 'C', accidental: 0 });
    expect(spellPitchClass(0, 'flat')).toEqual({ letter: 'C', accidental: 0 });
  });
});

describe('CHROMATIC_ROOTS', () => {
  it('cubre las 12 clases de altura sin repetir', () => {
    const pitchClasses = CHROMATIC_ROOTS.map(pitchClassOf);
    expect([...pitchClasses].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('usa el deletreo convencional (E♭, A♭, B♭ en bemol; C♯, F♯ en sostenido)', () => {
    const names = CHROMATIC_ROOTS.map(formatNoteName);
    expect(names).toEqual([
      'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B',
    ]);
  });
});
