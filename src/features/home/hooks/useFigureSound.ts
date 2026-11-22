import { useCallback, useState } from 'react';

import { rhythmClip } from '@/domain/lessons';
import { FigureId } from '@/domain/rhythm';

import { useClipPlayer } from './useClipPlayer';

export interface FigureSound {
  /** La figura que está sonando ahora (se pinta mientras dure su nota). */
  sounding: FigureId | null;
  /**
   * Sube con cada reproducción: volver a tocar la figura que ya suena la
   * reinicia, y quien la sigue (el cursor de su línea) debe empezar de nuevo.
   */
  take: number;
  play: (figure: FigureId) => void;
}

/**
 * Hace sonar figuras: una nota de piano que dura lo que la figura. Suena una
 * a la vez (otra figura corta la anterior), y `sounding` dice cuál, para que
 * la figura se encienda exactamente lo que dura su sonido. Con `pulse`, suena
 * sobre el pulso (la práctica: "una negra = un pulso").
 */
export function useFigureSound(pulse = false): FigureSound {
  const player = useClipPlayer();
  const [sounding, setSounding] = useState<FigureId | null>(null);
  const [take, setTake] = useState(0);
  const { play: playClip } = player;

  const play = useCallback(
    (figure: FigureId) => {
      const start = playClip(rhythmClip([figure], { pulse }), {
        onEnd: () => setSounding(null),
      });
      setSounding(start === null ? null : figure);
      setTake((current) => current + 1);
    },
    [playClip, pulse],
  );

  return { sounding, take, play };
}
