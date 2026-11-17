import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Ícono de cada módulo de la ruta, por su número. */
const MODULE_ICONS: Record<number, IconName> = {
  1: 'music-clef-treble',
  2: 'metronome',
  3: 'music-note-half',
  4: 'music-rest-quarter',
  5: 'view-week',
  6: 'file-music',
  7: 'music-clef-bass',
  8: 'stairs-up',
  9: 'music-accidental-sharp',
  10: 'arrow-expand-horizontal',
};

export function moduleIcon(number: number): IconName {
  return MODULE_ICONS[number] ?? 'music-note';
}

export function feedbackTitle(correct: boolean): string {
  return correct ? '¡Bien hecho!' : 'No es correcto';
}
