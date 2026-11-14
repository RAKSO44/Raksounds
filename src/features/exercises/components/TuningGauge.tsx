import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  GAUGE_IN_TUNE_ZONE,
  GAUGE_RANGE_CENTS,
  SingingVerdict,
  tuningGaugeReading,
} from '@/domain/singing';
import {
  controls,
  motion,
  radii,
  spacing,
  ThemeColors,
  typography,
  useTheme,
} from '@/shared/theme';

interface TuningGaugeProps {
  /** Desviación respecto a la nota pedida (ver `SingingEvaluation.centsOff`). */
  centsOff: number;
  verdict: SingingVerdict;
  /** Nota pedida, ya formateada: es el centro de la escala. */
  targetLabel: string;
}

function markerColor(verdict: SingingVerdict, colors: ThemeColors): string {
  switch (verdict) {
    case 'perfect':
      return colors.brand;
    case 'correct':
      return colors.success;
    case 'close':
      return colors.warning;
    case 'wrong':
      return colors.danger;
  }
}

/**
 * Barra de afinación de la corrección: una escala de -50 a +50 cents centrada
 * en la nota pedida, con la zona afinada (±25) marcada y una aguja en lo que
 * se cantó.
 *
 * La aguja sale del centro y se desliza hasta su lectura cuando la hoja ya
 * subió: un movimiento corto y direccional que "cuenta" cuánto se desvió.
 * Si se cantó otra nota, la aguja se queda en el borde y el rótulo de ese lado
 * se colorea para decir si fue más grave o más aguda.
 */
export function TuningGauge({ centsOff, verdict, targetLabel }: TuningGaugeProps) {
  const { colors } = useTheme();
  const reading = tuningGaugeReading(centsOff);
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      motion.sheet,
      withTiming(1, { duration: motion.gauge, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const markerStyle = useAnimatedStyle(() => {
    const position = 0.5 + (reading.position - 0.5) * progress.value;
    return {
      opacity: width === 0 ? 0 : 1,
      transform: [{ translateX: position * width - controls.gaugeMarkerWidth / 2 }],
    };
  });

  const marker = markerColor(verdict, colors);
  const edgeLabel = (side: 'low' | 'high') => {
    const overflowed = reading.overflow === side;
    const text = overflowed
      ? side === 'low'
        ? '« más grave'
        : 'más aguda »'
      : `${side === 'low' ? '−' : '+'}${GAUGE_RANGE_CENTS} cents`;
    return (
      <Text
        style={[
          styles.edge,
          side === 'high' && styles.edgeHigh,
          { color: overflowed ? marker : colors.textSecondary },
        ]}
      >
        {text}
      </Text>
    );
  };

  const [zoneStart, zoneEnd] = GAUGE_IN_TUNE_ZONE;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Afinación: ${Math.round(centsOff)} cents respecto a ${targetLabel}`}
    >
      <View style={styles.meter} onLayout={onLayout}>
        <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
          <View
            style={[
              styles.zone,
              {
                backgroundColor: colors.success,
                left: `${zoneStart * 100}%`,
                width: `${(zoneEnd - zoneStart) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={[styles.centerTick, { backgroundColor: colors.successShadow }]} />
        <Animated.View
          style={[
            styles.marker,
            { backgroundColor: marker, borderColor: colors.background },
            markerStyle,
          ]}
        />
      </View>

      <View style={styles.labels}>
        {edgeLabel('low')}
        <Text style={[styles.target, { color: colors.textPrimary }]}>{targetLabel}</Text>
        {edgeLabel('high')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  meter: {
    height: controls.gaugeMarkerHeight,
    justifyContent: 'center',
  },
  track: {
    height: controls.gaugeTrackHeight,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  centerTick: {
    position: 'absolute',
    left: '50%',
    width: controls.gaugeTickWidth,
    height: controls.gaugeTrackHeight,
    marginLeft: -controls.gaugeTickWidth / 2,
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: controls.gaugeMarkerWidth,
    height: controls.gaugeMarkerHeight,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  edge: {
    ...typography.caption,
    flex: 1,
  },
  edgeHigh: {
    textAlign: 'right',
  },
  target: {
    ...typography.chip,
    flexShrink: 0,
    textAlign: 'center',
  },
});
