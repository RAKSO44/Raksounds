import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { controls, radii, useTheme } from '@/shared/theme';

import { Playhead } from '../../hooks/useBarPlayback';

interface PlayheadLineProps {
  playhead: Playhead;
  /** Lo que recorre, en píxeles. */
  width: number;
  height: number;
}

/**
 * La línea roja que recorre una línea rítmica mientras suena: lineal, llega
 * al final justo cuando termina lo que suena. Es el pulso avanzando.
 */
export function PlayheadLine({ playhead, width, height }: PlayheadLineProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const { take, delayMs, durationMs } = playhead;

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
    );
  }, [take, delayMs, durationMs, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (width - controls.durationCursorWidth) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.playhead, { height, backgroundColor: colors.heart }, style]}
    />
  );
}

const styles = StyleSheet.create({
  playhead: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: controls.durationCursorWidth,
    borderRadius: radii.pill,
  },
});
