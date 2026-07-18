import { ALL_SCALE_TYPES } from '../scaleFormulas';
import {
  defaultTypeOfFamily,
  familyOf,
  SCALE_FAMILIES,
  SCALE_TYPES_BY_FAMILY,
} from '../scaleFamilies';

describe('scaleFamilies', () => {
  it('expone exactamente dos familias: mayor y menor', () => {
    expect(SCALE_FAMILIES).toEqual(['major', 'minor']);
  });

  it('agrupa los subtipos esperados en cada familia', () => {
    expect(SCALE_TYPES_BY_FAMILY.major).toEqual(['major', 'majorArpeggio']);
    expect(SCALE_TYPES_BY_FAMILY.minor).toEqual([
      'naturalMinor',
      'harmonicMinor',
      'melodicMinor',
      'minorArpeggio',
    ]);
  });

  it('cubre todos los tipos sin duplicar ni omitir ninguno', () => {
    const grouped = [...SCALE_TYPES_BY_FAMILY.major, ...SCALE_TYPES_BY_FAMILY.minor];
    expect([...grouped].sort()).toEqual([...ALL_SCALE_TYPES].sort());
  });

  it('familyOf devuelve la familia correcta de cada tipo', () => {
    expect(familyOf('major')).toBe('major');
    expect(familyOf('majorArpeggio')).toBe('major');
    expect(familyOf('naturalMinor')).toBe('minor');
    expect(familyOf('minorArpeggio')).toBe('minor');
  });

  it('el subtipo por defecto de cada familia es su primer elemento', () => {
    expect(defaultTypeOfFamily('major')).toBe('major');
    expect(defaultTypeOfFamily('minor')).toBe('naturalMinor');
  });
});
