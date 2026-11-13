import Animated, { FadeInDown } from 'react-native-reanimated';

import { LevelTier } from '@/domain/ear-training';
import { PushButton } from '@/shared/design-system';
import { motion, typography } from '@/shared/theme';

import { TIER_TONES } from '../labels';

interface LevelOptionProps {
  /** Número visible del nivel. */
  number: number;
  tier: LevelTier;
  /** Qué trae el nivel ("+ 3ªM y 3ªm", "Tríadas con inversiones"). */
  summary: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Fila de un nivel: el número a la izquierda y lo que ese nivel trae a la
 * derecha. En reposo TODOS los niveles son iguales (neutros): el color de la
 * dificultad —verde, amarillo y rojo— aparece solo al elegir uno, que es lo que
 * hace que la elección se lea.
 *
 * No sabe de qué ejercicio es el nivel: el resumen lo prepara la pantalla, así
 * sirve igual para los niveles de intervalos y para los de acordes.
 */
export function LevelOption({ number, tier, summary, selected, onSelect }: LevelOptionProps) {
  return (
    <Animated.View entering={FadeInDown.duration(motion.enter).delay(number * motion.stagger)}>
      <PushButton
        variant="selectable"
        tone={TIER_TONES[tier]}
        align="spread"
        label={`NIVEL ${number}`}
        labelStyle={typography.note}
        sublabel={summary}
        selected={selected}
        fullWidth
        accessibilityLabel={`Nivel ${number}: ${summary}`}
        onPress={onSelect}
      />
    </Animated.View>
  );
}
