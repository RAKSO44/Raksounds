import { useCallback } from 'react';

import { formatNote, formatNoteName, Note } from '@/domain/music-theory';
import { useSettingsStore } from '@/shared/settings';

/**
 * Cómo se escribe una nota en los ejercicios: con o sin número de octava, según
 * el ajuste de Configuración. Es el mismo criterio que en la Librería, por lo
 * que vive en un hook y no repetido en cada componente.
 */
export function useNoteFormatter(): (note: Note) => string {
  const showOctave = useSettingsStore((state) => state.showOctave);

  return useCallback(
    (note: Note) => (showOctave ? formatNote(note) : formatNoteName(note.name)),
    [showOctave],
  );
}
