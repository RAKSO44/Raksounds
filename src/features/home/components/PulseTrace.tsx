import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { controls, motion, radii, useTheme } from '@/shared/theme';

import { HeardBeat } from '../hooks/usePulseLoop';

/** Marcas en pantalla a la vez: a 200 BPM cruzan unas 8. */
const MAX_TICKS = 10;
/** Tramo final de la línea en el que la marca se desvanece. */
const FADE_FROM = 0.85;

interface Tick {
  id: number;
  accent: boolean;
}

interface PulseTraceProps {
  beat: HeardBeat;
}

/**
 * La línea del pulso, como un oxímetro: cada golpe deja una marca que nace
 * junto al corazón y avanza por la línea a velocidad CONSTANTE. Por eso la
 * distancia entre marcas es el tempo hecho espacio: siempre igual con un
 * pulso regular, y más juntas cuanto más rápido. Los golpes fuertes dejan una
 * marca más alta.
 */
export function PulseTrace({ beat }: PulseTraceProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [ticks, setTicks] = useState<readonly Tick[]>([]);
  const [seen, setSeen] = useState(beat.count);

  // Un golpe nuevo deja su marca (ajuste de estado al cambiar la prop, sin efecto).
  if (beat.count !== seen) {
    setSeen(beat.count);
    setTicks([...ticks.slice(-(MAX_TICKS - 1)), { id: beat.count, accent: beat.accent }]);
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.trace}
    >
      <View style={[styles.baseline, { backgroundColor: colors.border }]} />
      {width > 0 &&
        ticks.map((tick) => (
          <TraceTick key={tick.id} accent={tick.accent} width={width} color={colors.heart} />
        ))}
    </View>
  );
}

function TraceTick({ accent, width, color }: { accent: boolean; width: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Lineal a propósito: la velocidad constante es lo que se está enseñando.
    progress.value = withTiming(1, { duration: motion.traceCross, easing: Easing.linear });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [FADE_FROM, 1], [1, 0], 'clamp'),
    transform: [{ translateX: progress.value * (width - controls.pulseTickWidth) }],
  }));

  const height = accent ? controls.pulseAccentTickHeight : controls.pulseTickHeight;
  return (
    <Animated.View
      style={[
        styles.tick,
        { height, top: (controls.pulseTraceHeight - height) / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  trace: {
    height: controls.pulseTraceHeight,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  baseline: {
    height: controls.pulseTraceStroke,
    borderRadius: radii.pill,
  },
  tick: {
    position: 'absolute',
    left: 0,
    width: controls.pulseTickWidth,
    borderRadius: radii.pill,
  },
});
