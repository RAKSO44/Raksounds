import { useCallback, useRef, useState } from 'react';

import { clipDurationMs, itemsClip } from '@/domain/lessons';
import { RhythmItem } from '@/domain/rhythm';

import { useClipPlayer } from './useClipPlayer';

/** Una pasada de la línea roja: arranca dentro de `delayMs` y cruza en `durationMs`. */
export interface Playhead {
  /** Cambia con cada reproducción, para reiniciar la línea. */
  take: number;
  delayMs: number;
  durationMs: number;
  /** Qué línea suena, cuando la hoja tiene varias (solo esa muestra la línea roja). */
  tag: string | null;
}

export interface PlayOptions {
  /**
   * Lo que dura la línea entera, en semicorcheas, si es más que lo escrito:
   * lo que sobra suena como silencio y la línea roja la recorre hasta el final.
   */
  lengthUnits?: number;
  /** Qué línea es (ver `Playhead.tag`). */
  tag?: string;
}

export interface BarPlayback {
  ready: boolean;
  /** La pasada en curso de la línea roja; `null` si no suena. */
  playhead: Playhead | null;
  /** Hace sonar lo escrito sobre el pulso, de principio a fin. */
  play: (items: readonly RhythmItem[], options?: PlayOptions) => void;
  /** La corta y la deja en cero. */
  stop: () => void;
}

/**
 * Reproducir una línea rítmica: lo escrito (con silencios, puntillos y
 * ligaduras) con el pulso de fondo (una negra = un pulso) y, a la vez, una
 * línea roja que la recorre. Al terminar, simplemente deja de sonar. Suena
 * una a la vez: reproducir otra corta la anterior.
 */
export function useBarPlayback(): BarPlayback {
  const { ready, play: playClip, stop: stopClip } = useClipPlayer();
  const [playhead, setPlayhead] = useState<Playhead | null>(null);
  const take = useRef(0);

  const stop = useCallback(() => {
    stopClip();
    setPlayhead(null);
  }, [stopClip]);

  const play = useCallback(
    (items: readonly RhythmItem[], { lengthUnits, tag }: PlayOptions = {}) => {
      const clip = itemsClip(items, { pulse: true, lengthUnits });
      const start = playClip(clip, { onEnd: () => setPlayhead(null) });
      if (start === null) return;
      take.current += 1;
      setPlayhead({
        take: take.current,
        delayMs: Math.max(0, start - performance.now()),
        durationMs: clipDurationMs(clip),
        tag: tag ?? null,
      });
    },
    [playClip],
  );

  return { ready, playhead, play, stop };
}
