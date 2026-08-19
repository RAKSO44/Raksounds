import Animated, { FadeInDown } from 'react-native-reanimated';

import { ExerciseLevel } from '@/domain/ear-training';
import { PushButton } from '@/shared/design-system';
import { motion, typography } from '@/shared/theme';

import { INTERVAL_COMPACT_LABELS, TIER_TONES } from '../labels';

interface LevelOptionProps {
  level: ExerciseLevel;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Fila de un nivel: el número a la izquierda y lo que ese nivel añade a la
 * derecha. En reposo TODOS los niveles son iguales (neutros): el color de la
 * dificultad —verde, amarillo, morado y rojo para el tritono— aparece solo al
 * elegir uno, que es lo que hace que la elección se lea.
 */
export function LevelOption({ level, selected, onSelect }: LevelOptionProps) {
  // A partir del segundo nivel el resumen es incremental ("+ 3ªM y 3ªm"): lo
  // que importa al elegir es qué se suma, no repetir toda la lista acumulada.
  const added = level.added.map((interval) => INTERVAL_COMPACT_LABELS[interval]).join(' y ');
  const summary = level.number === 1 ? added : `+ ${added}`;

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.enter).delay(level.number * motion.stagger)}
    >
      <PushButton
        variant="selectable"
        tone={TIER_TONES[level.tier]}
        align="spread"
        label={`NIVEL ${level.number}`}
        labelStyle={typography.note}
        sublabel={summary}
        selected={selected}
        fullWidth
        accessibilityLabel={`Nivel ${level.number}: ${summary}`}
        onPress={onSelect}
      />
    </Animated.View>
  );
}
