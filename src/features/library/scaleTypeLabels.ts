import { ScaleType } from '@/domain/music-theory';

/** Etiquetas de UI en español. La clave de dominio permanece en inglés. */
export const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  major: 'Mayor',
  naturalMinor: 'Menor natural',
  harmonicMinor: 'Menor armónica',
  melodicMinor: 'Menor melódica',
  majorArpeggio: 'Arpegio mayor',
  minorArpeggio: 'Arpegio menor',
};
