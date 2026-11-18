import { useEffect, useRef, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/shared/theme';

export const STAGE_CHANGE = { duration: motion.stageColor, easing: Easing.out(Easing.cubic) };

/**
 * El paso de una etapa a otra en la tarjeta: sus colores se funden de los de
 * la etapa anterior a los de la nueva (desde donde estuvieran, si el cambio
 * llega a mitad de otro), y se recuerda si se avanzó o se retrocedió para que
 * el texto entre por el lado del recorrido.
 */
export function useStageChange(current: number, face: string, lip: string) {
  const blend = useSharedValue(1);
  const shown = useRef({ index: current, face, lip });
  const [state, setState] = useState({
    from: { face, lip },
    to: { face, lip },
    forward: true,
  });

  useEffect(() => {
    const previous = shown.current;
    if (previous.face === face && previous.lip === lip && previous.index === current) return;
    shown.current = { index: current, face, lip };
    setState({ from: previous, to: { face, lip }, forward: current >= previous.index });
    blend.value = 0;
    blend.value = withTiming(1, STAGE_CHANGE);
  }, [current, face, lip, blend]);

  return { blend, ...state };
}
