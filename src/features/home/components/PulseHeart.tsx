import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PRESS_SLOP } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, motion, spacing, typography, useTheme } from '@/shared/theme';

import { HeardBeat } from '../hooks/usePulseLoop';

/** "BUM" en vuelo a la vez: a 200 BPM caben unos 3 antes de desvanecerse. */
const MAX_BUMS = 4;
/** Los "BUM" salen hacia arriba (en grados, 0 = derecha): nunca tapan el texto de abajo. */
const BUM_ANGLE = { min: -160, max: -20 } as const;
/**
 * Dirección "al azar" de cada BUM sin `Math.random` en el render: la parte
 * decimal de n × φ salta por todo el rango sin repetirse ni agruparse.
 */
const GOLDEN = 0.6180339887;

function bumAngle(count: number): number {
  const spread = (count * GOLDEN) % 1;
  const degrees = BUM_ANGLE.min + spread * (BUM_ANGLE.max - BUM_ANGLE.min);
  return (degrees * Math.PI) / 180;
}

interface Bum {
  id: number;
  accent: boolean;
  /** Dirección de salida, en radianes. */
  angle: number;
}

interface PulseHeartProps {
  running: boolean;
  beat: HeardBeat;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * El corazón que late con el pulso: un interruptor (tocarlo arranca o detiene
 * el pulso). Con cada golpe se agranda un poco y vuelve —más en el fuerte— y
 * suelta un "BUM" en una dirección al azar.
 *
 * Es la ÚNICA animación de escala de la app (excepción pedida en el boceto del
 * Módulo 2): un latido sin muelle ni rebote, subida rápida y vuelta con curva
 * de salida.
 */
export function PulseHeart({ running, beat, disabled = false, onToggle }: PulseHeartProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const [bums, setBums] = useState<readonly Bum[]>([]);
  const [seen, setSeen] = useState(beat.count);

  // Cada golpe nuevo suelta su BUM (ajuste de estado al cambiar la prop, sin efecto).
  if (beat.count !== seen) {
    setSeen(beat.count);
    setBums([
      ...bums.slice(-(MAX_BUMS - 1)),
      { id: beat.count, accent: beat.accent, angle: bumAngle(beat.count) },
    ]);
  }

  useEffect(() => {
    if (beat.count === 0) return;
    const peak = beat.accent ? controls.heartAccentScale : controls.heartBeatScale;
    scale.value = withSequence(
      withTiming(peak, { duration: motion.heartRise, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: motion.heartFall, easing: Easing.out(Easing.cubic) }),
    );
  }, [beat, scale]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Mismo patrón que `PushButton`: golpe seco al tocar y la acción al
  // completar el tap. La háptica responde aunque el metrónomo aún cargue,
  // para que el toque nunca se sienta muerto.
  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(PRESS_SLOP)
        .runOnJS(true)
        .onStart(() => hapticPressIn())
        .onEnd((_event, success) => {
          if (success && !disabled) onToggle();
        }),
    [disabled, onToggle],
  );

  return (
    <View style={styles.box}>
      {bums.map((bum) => (
        <BumText key={bum.id} bum={bum} color={colors.heart} />
      ))}
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={running ? 'Detener el pulso' : 'Escuchar el pulso'}
          accessibilityState={{ disabled }}
          style={heartStyle}
        >
          <MaterialCommunityIcons
            name="heart"
            size={controls.pulseHeartSize}
            color={colors.heart}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Un "BUM" que sale del centro del corazón, viaja y se desvanece. */
function BumText({ bum, color }: { bum: Bum; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: motion.bum, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(bum.angle) * controls.bumTravel * progress.value },
      { translateY: Math.sin(bum.angle) * controls.bumTravel * progress.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.bum, style]}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[bum.accent ? styles.bumAccent : styles.bumWeak, { color }]}
      >
        BUM
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    // Aire arriba para que los "BUM" se vean salir.
    paddingTop: spacing.xl,
  },
  bum: {
    position: 'absolute',
    top: spacing.xl,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bumWeak: {
    ...typography.chip,
    flexShrink: 0,
  },
  bumAccent: {
    ...typography.headerTitle,
    flexShrink: 0,
  },
});
