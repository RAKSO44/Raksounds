import { formatNote, NoteName, CHROMATIC_ROOTS } from '@/domain/music-theory';

import {
  CHORD_HIGHEST_MIDI,
  CHORD_LOWEST_MIDI,
  positionCount,
  SonorityId,
  SONORITIES,
  voiceChord,
} from '../chords';

const C: NoteName = { letter: 'C', accidental: 0 };
const E_FLAT: NoteName = { letter: 'E', accidental: -1 };
const B: NoteName = { letter: 'B', accidental: 0 };

function labels(root: NoteName, sonority: SonorityId, inversion = 0): string[] {
  return voiceChord(root, 4, sonority, inversion).map(
    (tone) => `${tone.fn}:${formatNote(tone.note)}`,
  );
}

describe('voiceChord', () => {
  it('tríada mayor en estado fundamental', () => {
    expect(labels(C, 'majorTriad')).toEqual(['root:C4', 'third:E4', 'fifth:G4']);
  });

  it('deletrea por función, no por altura (3ª menor de E♭ es G♭)', () => {
    expect(labels(E_FLAT, 'minorTriad')).toEqual(['root:E♭4', 'third:G♭4', 'fifth:B♭4']);
  });

  it('primera inversión: la 3ª queda en el bajo y la fundamental arriba', () => {
    expect(labels(C, 'majorTriad', 1)).toEqual(['third:E4', 'fifth:G4', 'root:C5']);
  });

  it('segunda inversión: la 5ª en el bajo', () => {
    expect(labels(C, 'majorTriad', 2)).toEqual(['fifth:G4', 'root:C5', 'third:E5']);
  });

  it('baja una octava el acorde que se saldría del banco por arriba', () => {
    expect(labels(B, 'majorTriad', 2)).toEqual(['fifth:F♯4', 'root:B4', 'third:D♯5']);
  });

  it('cuatríadas con su 7ª', () => {
    expect(labels(C, 'majorSeventh')).toEqual(['root:C4', 'third:E4', 'fifth:G4', 'seventh:B4']);
    expect(labels(C, 'dominantSeventh').at(-1)).toBe('seventh:B♭4');
    expect(labels(C, 'minorSeventh')).toEqual(['root:C4', 'third:E♭4', 'fifth:G4', 'seventh:B♭4']);
  });

  it('todas las sonoridades, tónicas y posiciones caben en el banco C4–C6', () => {
    for (const sonority of Object.keys(SONORITIES) as SonorityId[]) {
      for (const root of CHROMATIC_ROOTS) {
        for (let inversion = 0; inversion < positionCount(sonority); inversion += 1) {
          const tones = voiceChord(root, 4, sonority, inversion);
          expect(tones[0].midi).toBeGreaterThanOrEqual(CHORD_LOWEST_MIDI);
          expect(tones[tones.length - 1].midi).toBeLessThanOrEqual(CHORD_HIGHEST_MIDI);
          // En la inversión k el bajo es la k-ésima nota de la fórmula.
          expect(tones[0].fn).toBe(SONORITIES[sonority][inversion].fn);
        }
      }
    }
  });
});
