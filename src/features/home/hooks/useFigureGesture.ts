import { useMemo } from 'react';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';

import { PRESS_SLOP } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls } from '@/shared/theme';

/** Lo que hay que mover el dedo para que tocar pase a ser arrastrar. */
const DRAG_START = 6;

/** Posición de un dedo en la ventana. */
export interface FingerPoint {
  x: number;
  y: number;
}

/**
 * Arrastre de una figura. Lo que viaja bajo el dedo no es la figura sino una
 * copia flotante que pinta quien recibe el arrastre: así la paleta nunca "se
 * acaba" y una figura colocada deja su sitio a la vista mientras se mueve.
 */
export interface FigureDrag {
  /** El dedo, actualizado en el hilo de UI (la copia lo sigue sin pasar por React). */
  finger: SharedValue<FingerPoint>;
  onStart: () => void;
  /** Cada paso del dedo, en el hilo de JS (para mostrar dónde caería). */
  onMove: (x: number, y: number) => void;
  /** Al soltar; `completed` es falso si el sistema canceló el gesto. */
  onEnd: (completed: boolean) => void;
}

export interface FigureGestureOptions {
  /** Al tocar: la figura suena aquí, como una tecla. */
  onPressIn?: () => void;
  /** Tap completo, sin arrastrar ni mantener. */
  onPress?: () => void;
  /** Mantener pulsada (`controls.removeHoldMs`). */
  onLongPress?: () => void;
  drag?: FigureDrag;
}

/**
 * El gesto de una figura tocable: tocar, mantener y arrastrar compiten y gana
 * el primero que se cumple. La cara se hunde al apoyar el dedo (mismo snap y
 * háptica que un `PushButton`) y vuelve al soltar o al empezar a arrastrar.
 */
export function useFigureGesture({ onPressIn, onPress, onLongPress, drag }: FigureGestureOptions) {
  const pressed = useSharedValue(0);

  /* eslint-disable react-hooks/immutability -- mutar .value es la API de shared values de reanimated */
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDistance(PRESS_SLOP)
      .runOnJS(true)
      .onBegin(() => {
        pressed.value = 1;
        hapticPressIn();
        onPressIn?.();
      })
      .onEnd((_event, success) => {
        if (success) onPress?.();
      })
      .onFinalize(() => {
        pressed.value = 0;
      });

    const rivals: GestureType[] = [];
    if (drag !== undefined) {
      const { finger, onStart, onMove, onEnd } = drag;
      rivals.push(
        Gesture.Pan()
          .minDistance(DRAG_START)
          .onStart((event) => {
            pressed.value = 0;
            finger.value = { x: event.absoluteX, y: event.absoluteY };
            runOnJS(onStart)();
          })
          .onUpdate((event) => {
            finger.value = { x: event.absoluteX, y: event.absoluteY };
            runOnJS(onMove)(event.absoluteX, event.absoluteY);
          })
          .onEnd((_event, success) => {
            runOnJS(onEnd)(success);
          }),
      );
    }
    if (onLongPress !== undefined) {
      rivals.push(
        Gesture.LongPress()
          .minDuration(controls.removeHoldMs)
          .maxDistance(PRESS_SLOP)
          .runOnJS(true)
          .onStart(() => {
            pressed.value = 0;
            onLongPress();
          }),
      );
    }
    return rivals.length === 0 ? tap : Gesture.Race(...rivals, tap);
  }, [drag, onLongPress, onPress, onPressIn, pressed]);
  /* eslint-enable react-hooks/immutability */

  return { gesture, pressed };
}
