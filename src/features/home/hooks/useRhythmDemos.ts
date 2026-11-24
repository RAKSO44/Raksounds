import { useCallback } from 'react';

import { RhythmItem } from '@/domain/rhythm';

import { Playhead, useBarPlayback } from './useBarPlayback';

export interface RhythmDemos {
  ready: boolean;
  /** ¿Suena la línea `tag`? */
  isPlaying: (tag: string) => boolean;
  /** La línea roja de la línea `tag`, o `null` si no es la que suena. */
  playheadOf: (tag: string) => Playhead | null;
  /**
   * Reproducir/pausar la línea `tag`: si ya suena, se corta; si no, suena
   * entera (`lengthUnits`), cortando la que sonara.
   */
  toggle: (tag: string, items: readonly RhythmItem[], lengthUnits: number) => void;
  stop: () => void;
}

/**
 * Las líneas rítmicas de una hoja de teoría, cada una con su botón de
 * reproducir. Suena una a la vez (el pulso es uno solo) y solo la que suena
 * muestra su línea roja.
 */
export function useRhythmDemos(): RhythmDemos {
  const { ready, playhead, play, stop } = useBarPlayback();

  const isPlaying = useCallback((tag: string) => playhead?.tag === tag, [playhead]);
  const playheadOf = useCallback(
    (tag: string) => (playhead?.tag === tag ? playhead : null),
    [playhead],
  );
  const toggle = useCallback(
    (tag: string, items: readonly RhythmItem[], lengthUnits: number) => {
      if (playhead?.tag === tag) stop();
      else play(items, { lengthUnits, tag });
    },
    [play, playhead, stop],
  );

  return { ready, isPlaying, playheadOf, toggle, stop };
}
