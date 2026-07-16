import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildScale,
  CHROMATIC_ROOTS,
  NoteName,
  Scale,
  ScaleDegree,
  ScaleType,
} from '@/domain/music-theory';
import { createExpoAudioPlayer } from '@/infrastructure/audio/ExpoAudioPlayer';

/**
 * Octava por defecto de la tónica. C4–B4 es cómodo como referencia inicial;
 * un selector de octava (para voces graves/agudas) llegará con Configuraciones.
 */
const DEFAULT_ROOT_OCTAVE = 4;

/**
 * Único punto de composición entre el dominio musical y la implementación
 * real de audio. Singleton a nivel de módulo: la Librería es la tab inicial
 * y las muestras precargadas deben sobrevivir a la navegación.
 */
const audioPlayer = createExpoAudioPlayer();

export interface ScalePlayer {
  root: NoteName;
  setRoot: (root: NoteName) => void;
  scaleType: ScaleType;
  setScaleType: (type: ScaleType) => void;
  scale: Scale;
  /** false hasta que las muestras terminan de precargar. */
  ready: boolean;
  playDegree: (degree: ScaleDegree) => void;
}

export function useScalePlayer(): ScalePlayer {
  const [root, setRoot] = useState<NoteName>(CHROMATIC_ROOTS[0]);
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    audioPlayer.load().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const scale = useMemo(
    () => buildScale(root, DEFAULT_ROOT_OCTAVE, scaleType),
    [root, scaleType],
  );

  const playDegree = useCallback(
    (degree: ScaleDegree) => {
      if (!ready) return;
      audioPlayer.playNote(degree.midi);
    },
    [ready],
  );

  return { root, setRoot, scaleType, setScaleType, scale, ready, playDegree };
}
