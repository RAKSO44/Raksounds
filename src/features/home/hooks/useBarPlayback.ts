import { useCallback, useRef, useState } from 'react';

import { clipDurationMs, rhythmClip } from '@/domain/lessons';
import { FigureId } from '@/domain/rhythm';

import { useClipPlayer } from './useClipPlayer';

/** Una pasada de la línea roja: arranca dentro de `delayMs` y cruza en `durationMs`. */
export interface Playhead {
  /** Cambia con cada reproducción, para reiniciar la línea. */
  take: number;
  delayMs: number;
  durationMs: number;
}

export interface BarPlayback {
  ready: boolean;
  /** La pasada en curso de la línea roja; `null` si no suena. */
  playhead: Playhead | null;
  /** Hace sonar la barra entera sobre el pulso, de principio a fin. */
  play: (figures: readonly FigureId[]) => void;
  /** La corta y la deja en cero. */
  stop: () => void;
}

/**
 * Reproducir una barra llena: sus figuras seguidas con el pulso de fondo
 * (una negra = un pulso) y, a la vez, una línea roja que la recorre. Al
 * terminar, simplemente deja de sonar.
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
    (figures: readonly FigureId[]) => {
      const clip = rhythmClip(figures, { pulse: true });
      const start = playClip(clip, { onEnd: () => setPlayhead(null) });
      if (start === null) return;
      take.current += 1;
      setPlayhead({
        take: take.current,
        delayMs: Math.max(0, start - performance.now()),
        durationMs: clipDurationMs(clip),
      });
    },
    [playClip],
  );

  return { ready, playhead, play, stop };
}
