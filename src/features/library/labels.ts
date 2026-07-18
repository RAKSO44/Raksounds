import { ScaleFamily, ScaleType } from '@/domain/music-theory';

/** Etiquetas de UI en español. Las claves de dominio permanecen en inglés. */

export const FAMILY_LABELS: Record<ScaleFamily, string> = {
  major: 'Mayor',
  minor: 'Menor',
};

/**
 * Etiqueta del subtipo dentro de su familia. Como la familia ya indica el modo,
 * el arpegio se muestra solo como "Arpegio" (mayor o menor según la familia).
 */
export const SUBTYPE_LABELS: Record<ScaleType, string> = {
  major: 'Escala Mayor',
  majorArpeggio: 'Arpegio',
  naturalMinor: 'Escala Natural',
  harmonicMinor: 'Escala armónica',
  melodicMinor: 'Escala melódica',
  minorArpeggio: 'Arpegio',
};
