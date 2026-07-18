import { ScaleType } from './scaleFormulas';

/**
 * Agrupación de los tipos en dos familias tonales. Es la primera decisión del
 * usuario en la Librería (Mayor / Menor); el subtipo concreto se elige después.
 *
 * Musicalmente:
 * - `major` reúne la escala mayor y su arpegio mayor.
 * - `minor` reúne las tres variantes de la escala menor (natural, armónica,
 *   melódica) y el arpegio menor.
 */
export type ScaleFamily = 'major' | 'minor';

export const SCALE_FAMILIES: readonly ScaleFamily[] = ['major', 'minor'];

/** Subtipos de cada familia, en el orden en que se muestran. */
export const SCALE_TYPES_BY_FAMILY: Record<ScaleFamily, readonly ScaleType[]> = {
  major: ['major', 'majorArpeggio'],
  minor: ['naturalMinor', 'harmonicMinor', 'melodicMinor', 'minorArpeggio'],
};

/** Familia a la que pertenece un tipo. */
export function familyOf(type: ScaleType): ScaleFamily {
  return SCALE_TYPES_BY_FAMILY.major.includes(type) ? 'major' : 'minor';
}

/** Subtipo por defecto al entrar (o volver) a una familia: siempre el primero. */
export function defaultTypeOfFamily(family: ScaleFamily): ScaleType {
  return SCALE_TYPES_BY_FAMILY[family][0];
}
