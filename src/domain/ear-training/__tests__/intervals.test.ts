import { CHROMATIC_ROOTS, formatNote } from '@/domain/music-theory';

import { ALL_INTERVAL_IDS, INTERVALS, noteAtInterval, semitonesOf } from '../intervals';

describe('INTERVALS', () => {
  it('lista los doce intervalos ascendentes de la octava, sin repetir distancia', () => {
    const semitones = ALL_INTERVAL_IDS.map(semitonesOf);
    expect(semitones).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('cada entrada del catálogo se indexa por su propio id', () => {
    for (const id of ALL_INTERVAL_IDS) {
      expect(INTERVALS[id].id).toBe(id);
    }
  });
});

describe('noteAtInterval', () => {
  const C = { letter: 'C', accidental: 0 } as const;
  const Eb = { letter: 'E', accidental: -1 } as const;
  const Cs = { letter: 'C', accidental: 1 } as const;

  it('sube el intervalo sobre la nota base', () => {
    expect(formatNote(noteAtInterval(C, 4, 'P5')!)).toBe('G4');
    expect(formatNote(noteAtInterval(C, 4, 'M3')!)).toBe('E4');
  });

  it('la octava justa cambia de octava científica, no de letra', () => {
    expect(formatNote(noteAtInterval(C, 4, 'P8')!)).toBe('C5');
    expect(formatNote(noteAtInterval(Eb, 4, 'P8')!)).toBe('E♭5');
  });

  it('deletrea según el NÚMERO del intervalo, no por enarmonía cómoda', () => {
    // 3ª menor sobre E♭ avanza dos letras (E → G): G♭, nunca F♯.
    expect(formatNote(noteAtInterval(Eb, 4, 'm3')!)).toBe('G♭4');
    // 6ª mayor sobre E♭ avanza cinco letras (E → C).
    expect(formatNote(noteAtInterval(Eb, 4, 'M6')!)).toBe('C5');
  });

  it('el tritono se deletrea como 4ª aumentada, con doble alteración si toca', () => {
    expect(formatNote(noteAtInterval(C, 4, 'TT')!)).toBe('F♯4');
    // C♯ + 4ª aumentada = F♯♯4 (misma altura que G4, distinto deletreo).
    expect(formatNote(noteAtInterval(Cs, 4, 'TT')!)).toBe('F♯♯4');
  });

  it('las 12 tónicas de la app son deletreables en todos los intervalos', () => {
    // Si alguna combinación necesitara un triple sostenido, el generador
    // produciría ejercicios sin nota que mostrar: eso no debe poder pasar.
    for (const root of CHROMATIC_ROOTS) {
      for (const id of ALL_INTERVAL_IDS) {
        expect(noteAtInterval(root, 4, id)).not.toBeNull();
      }
    }
  });
});
