import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FIGURE_DEMO_BPM } from '@/domain/lessons';
import { figureById, figureDurationMs, FigureId } from '@/domain/rhythm';
import { controls, radii, useTheme } from '@/shared/theme';

interface DurationLineProps {
  figure: FigureId;
  /** Largo de la línea, como fracción del ancho disponible (la duración hecha espacio). */
  fraction: number;
  /** Mientras suena, un cursor rojo la recorre y llega al final justo cuando acaba la nota. */
  sounding: boolean;
  /** Cambia con cada toque: si la figura vuelve a sonar, el cursor arranca de cero. */
  take: number;
}

/**
 * La duración de una figura dibujada como una línea con topes: la blanca mide
 * el doble que la negra. Al sonar la figura, un cursor la recorre como el
 * oxímetro del pulso, así el largo se ve y se oye a la vez.
 */
export function DurationLine({ figure, fraction, sounding, take }: DurationLineProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (sounding) {
      // Lineal a propósito: el cursor avanza al ritmo del tiempo que suena la nota.
      progress.value = withTiming(1, {
        duration: figureDurationMs(figureById(figure), FIGURE_DEMO_BPM),
        easing: Easing.linear,
      });
    }
  }, [figure, sounding, take, progress]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: sounding ? 1 : 0,
    transform: [{ translateX: progress.value * (width.value - controls.durationCursorWidth) }],
  }));

  return (
    <View style={styles.area}>
      <View
        style={[styles.line, { width: `${fraction * 100}%` }]}
        onLayout={(event) => {
          width.value = event.nativeEvent.layout.width;
        }}
      >
        <View style={[styles.stroke, { backgroundColor: colors.textPrimary }]} />
        <View style={[styles.tick, styles.start, { backgroundColor: colors.textPrimary }]} />
        <View style={[styles.tick, styles.end, { backgroundColor: colors.textPrimary }]} />
        <Animated.View style={[styles.cursor, { backgroundColor: colors.heart }, cursorStyle]} />
      </View>
    </View>
  );
}

const TICK_TOP = (controls.durationLineHeight - controls.durationLineTickHeight) / 2;

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  line: {
    height: controls.durationLineHeight,
    justifyContent: 'center',
  },
  stroke: {
    height: controls.durationLineStroke,
  },
  tick: {
    position: 'absolute',
    top: TICK_TOP,
    width: controls.durationLineStroke,
    height: controls.durationLineTickHeight,
  },
  start: {
    left: 0,
  },
  end: {
    right: 0,
  },
  cursor: {
    position: 'absolute',
    top: TICK_TOP,
    left: 0,
    width: controls.durationCursorWidth,
    height: controls.durationLineTickHeight,
    borderRadius: radii.pill,
  },
});
