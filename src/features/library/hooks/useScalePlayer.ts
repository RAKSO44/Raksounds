import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildScale,
  CHROMATIC_ROOTS,
  defaultTypeOfFamily,
  familyOf,
  NoteName,
  Scale,
  ScaleDegree,
  ScaleFamily,
  ScaleType,
} from '@/domain/music-theory';
import { VoiceHandle } from '@/domain/audio/IAudioPlayer';
// Punto de composición entre el dominio musical y la implementación real de
// audio: la Librería consume el motor compartido de `infrastructure/audio`, el
// mismo que usan los Ejercicios (las muestras precargadas deben sobrevivir a la
// navegación y no duplicarse por pantalla).
import { pianoPlayer } from '@/infrastructure/audio/pianoPlayer';

/**
 * Octava por defecto de la tónica. C4–B4 es cómodo como referencia inicial;
 * un selector de octava (para voces graves/agudas) llegará con Configuraciones.
 */
const DEFAULT_ROOT_OCTAVE = 4;

export interface ScalePlayer {
  root: NoteName;
  setRoot: (root: NoteName) => void;
  /** Familia tonal seleccionada (Mayor/Menor); derivada del subtipo actual. */
  family: ScaleFamily;
  /** Cambia de familia y selecciona su primer subtipo. */
  setFamily: (family: ScaleFamily) => void;
  scaleType: ScaleType;
  setScaleType: (type: ScaleType) => void;
  scale: Scale;
  /** false hasta que las muestras terminan de precargar. */
  ready: boolean;
  /** El dedo toca la tecla: la nota empieza a sonar. */
  pressDegree: (degree: ScaleDegree) => void;
  /** El dedo suelta la tecla: la nota se libera gradualmente. */
  releaseDegree: (degree: ScaleDegree) => void;
}

export function useScalePlayer(): ScalePlayer {
  const [root, setRoot] = useState<NoteName>(CHROMATIC_ROOTS[0]);
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [ready, setReady] = useState(false);

  // La familia es un derivado del subtipo: no duplicamos estado.
  const family = familyOf(scaleType);
  const setFamily = useCallback((next: ScaleFamily) => setScaleType(defaultTypeOfFamily(next)), []);

  useEffect(() => {
    let mounted = true;
    pianoPlayer.load().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const scale = useMemo(() => buildScale(root, DEFAULT_ROOT_OCTAVE, scaleType), [root, scaleType]);

  // Voz que está sonando por cada grado pulsado. Es un ref y no estado porque
  // sonar una nota no repinta nada, y varias teclas pueden estar pulsadas a la
  // vez: cada una necesita recordar SU voz para poder soltarla por separado.
  const heldVoices = useRef(new Map<number, VoiceHandle>());

  const pressDegree = useCallback(
    (degree: ScaleDegree) => {
      if (!ready) return;
      const held = heldVoices.current;
      // Defensa por si un press-out se perdiera (gesto cancelado de forma rara):
      // sin esto la voz anterior quedaría sonando hasta agotar la muestra.
      const previous = held.get(degree.degreeIndex);
      if (previous !== undefined) pianoPlayer.noteOff(previous);

      held.set(degree.degreeIndex, pianoPlayer.noteOn(degree.midi));
    },
    [ready],
  );

  const releaseDegree = useCallback((degree: ScaleDegree) => {
    const held = heldVoices.current;
    const voice = held.get(degree.degreeIndex);
    if (voice === undefined) return;
    held.delete(degree.degreeIndex);
    pianoPlayer.noteOff(voice);
  }, []);

  // Al salir de la Librería (cambio de tab) no debe quedar ninguna nota colgada.
  useEffect(() => {
    const held = heldVoices.current;
    return () => {
      held.clear();
      pianoPlayer.stopAll();
    };
  }, []);

  return {
    root,
    setRoot,
    family,
    setFamily,
    scaleType,
    setScaleType,
    scale,
    ready,
    pressDegree,
    releaseDegree,
  };
}
