import { useEffect, useRef, useState } from 'react';
import {
  Easing,
  SharedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/shared/theme';

/** Lo que el nodo de un módulo muestra de su progreso. */
export interface NodeStatus {
  readonly theory: boolean;
  readonly practice: boolean;
}

export interface StatusTransition {
  /** Estado de antes del último cambio (de dónde parte el color). */
  from: NodeStatus;
  /** Estado que se muestra (adonde llega el color). */
  to: NodeStatus;
  /** 0 → 1: avance del cambio de color de `from` a `to`. */
  progress: SharedValue<number>;
  /** 0 → 1: recorrido del destello que cruza el nodo tras el cambio. */
  shine: SharedValue<number>;
}

/**
 * El cambio de estado de un nodo, animado SOLO cuando se ve. El progreso se
 * guarda mientras el usuario está en la teoría o la práctica (con el Home
 * debajo, sin verse); si el nodo cambiara entonces, la animación ocurriría a
 * escondidas. Por eso lo mostrado (`to`) solo se pone al día con la pantalla
 * a la vista: al volver, el color pasa del de antes al nuevo y un destello
 * cruza el nodo una vez. Al montar no se anima nada.
 */
export function useStatusTransition(status: NodeStatus, visible: boolean): StatusTransition {
  const [to, setTo] = useState(status);
  const [from, setFrom] = useState(status);
  const progress = useSharedValue(1);
  const shine = useSharedValue(0);
  const animated = useRef(to);

  // Ajuste de estado durante el render (no en un efecto): así el nodo nunca
  // pinta un fotograma con el estado nuevo antes de que empiece la animación.
  const changed = to.theory !== status.theory || to.practice !== status.practice;
  if (visible && changed) {
    setFrom(to);
    setTo(status);
  }

  useEffect(() => {
    if (animated.current === to) return;
    animated.current = to;
    // Se espera a que termine la transición de vuelta al Home antes de empezar.
    progress.value = 0;
    progress.value = withDelay(
      motion.enter,
      withTiming(1, { duration: motion.statusChange, easing: Easing.out(Easing.cubic) }),
    );
    shine.value = 0;
    shine.value = withDelay(
      motion.enter + motion.statusChange / 2,
      withTiming(1, { duration: motion.shine, easing: Easing.inOut(Easing.quad) }),
    );
  }, [to, progress, shine]);

  return { from, to, progress, shine };
}
