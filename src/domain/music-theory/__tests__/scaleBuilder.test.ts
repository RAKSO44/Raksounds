import { CHROMATIC_ROOTS, formatNote, NoteName, noteToMidi } from '../note';
import { buildScale } from '../scaleBuilder';
import { ALL_SCALE_TYPES, SCALE_FORMULAS } from '../scaleFormulas';

const C: NoteName = { letter: 'C', accidental: 0 };
const A: NoteName = { letter: 'A', accidental: 0 };
const E_FLAT: NoteName = { letter: 'E', accidental: -1 };
const C_SHARP: NoteName = { letter: 'C', accidental: 1 };
const G_SHARP: NoteName = { letter: 'G', accidental: 1 };
const B: NoteName = { letter: 'B', accidental: 0 };

function names(root: NoteName, octave: number, type: Parameters<typeof buildScale>[2]) {
  return buildScale(root, octave, type).degrees.map((d) => formatNote(d.note));
}

function midis(root: NoteName, octave: number, type: Parameters<typeof buildScale>[2]) {
  return buildScale(root, octave, type).degrees.map((d) => d.midi);
}

describe('buildScale — escalas', () => {
  it('C mayor: solo notas naturales, cerrando en la octava', () => {
    expect(names(C, 4, 'major')).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
    expect(midis(C, 4, 'major')).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it('E♭ mayor se deletrea con bemoles (B♭, no A♯)', () => {
    expect(names(E_FLAT, 4, 'major')).toEqual([
      'E♭4', 'F4', 'G4', 'A♭4', 'B♭4', 'C5', 'D5', 'E♭5',
    ]);
  });

  it('C♯ mayor produce E♯ y B♯ (cada letra una vez) y cierra en C♯5', () => {
    expect(names(C_SHARP, 4, 'major')).toEqual([
      'C♯4', 'D♯4', 'E♯4', 'F♯4', 'G♯4', 'A♯4', 'B♯4', 'C♯5',
    ]);
    // B♯4 se escribe en la octava 4 pero suena una octava sobre la tónica menos un semitono
    expect(midis(C_SHARP, 4, 'major')).toEqual([61, 63, 65, 66, 68, 70, 72, 73]);
  });

  it('A menor natural: solo notas naturales, cerrando en la octava', () => {
    expect(names(A, 3, 'naturalMinor')).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']);
  });

  it('A menor armónica eleva el 7.º grado (G♯)', () => {
    expect(names(A, 3, 'harmonicMinor')).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G♯4', 'A4']);
  });

  it('A menor melódica eleva 6.º y 7.º (F♯, G♯)', () => {
    expect(names(A, 3, 'melodicMinor')).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F♯4', 'G♯4', 'A4']);
  });

  it('G♯ menor melódica requiere doble sostenido (F♯♯)', () => {
    expect(names(G_SHARP, 3, 'melodicMinor')).toEqual([
      'G♯3', 'A♯3', 'B3', 'C♯4', 'D♯4', 'E♯4', 'F♯♯4', 'G♯4',
    ]);
  });

  it('la octava sube cuando el ciclo de letras pasa de B a C', () => {
    expect(names(B, 3, 'major')).toEqual(['B3', 'C♯4', 'D♯4', 'E4', 'F♯4', 'G♯4', 'A♯4', 'B4']);
  });
});

describe('buildScale — arpegios', () => {
  it('arpegio mayor de C: C E G + octava', () => {
    expect(names(C, 4, 'majorArpeggio')).toEqual(['C4', 'E4', 'G4', 'C5']);
    expect(midis(C, 4, 'majorArpeggio')).toEqual([60, 64, 67, 72]);
  });

  it('arpegio menor de A: A C E + octava', () => {
    expect(names(A, 3, 'minorArpeggio')).toEqual(['A3', 'C4', 'E4', 'A4']);
    expect(midis(A, 3, 'minorArpeggio')).toEqual([57, 60, 64, 69]);
  });

  it('arpegio mayor de E♭ se deletrea E♭ G B♭', () => {
    expect(names(E_FLAT, 4, 'majorArpeggio')).toEqual(['E♭4', 'G4', 'B♭4', 'E♭5']);
  });
});

describe('buildScale — invariantes', () => {
  it('el MIDI de cada grado coincide con tónica + fórmula en las 12 tónicas de la UI', () => {
    for (const type of ALL_SCALE_TYPES) {
      for (const root of CHROMATIC_ROOTS) {
        const scale = buildScale(root, 4, type);
        const rootMidi = noteToMidi({ name: root, octave: 4 });
        scale.degrees.forEach((degree, i) => {
          expect(degree.midi).toBe(rootMidi + SCALE_FORMULAS[type].semitones[i]);
          // El deletreo debe sonar exactamente igual que la altura declarada
          expect(noteToMidi(degree.note)).toBe(degree.midi);
        });
      }
    }
  });

  it('en las escalas, cada letra aparece exactamente una vez', () => {
    for (const root of CHROMATIC_ROOTS) {
      const scale = buildScale(root, 4, 'major');
      const letters = scale.degrees.map((d) => d.note.name.letter);
      expect(new Set(letters).size).toBe(7);
    }
  });
});
