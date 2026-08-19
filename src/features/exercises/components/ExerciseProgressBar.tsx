import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { controls, radii, useTheme } from '@/shared/theme';

interface ExerciseProgressBarProps {
  /** Ejercicios ya respondidos. */
  completed: number;
  total: number;
}

/**
 * Barra de progreso de la ronda, el elemento más reconocible de una lección de
 * Duolingo. El relleno NO salta: avanza con un muelle corto cada vez que se
 * responde, que es lo que hace sentir que la ronda "progresa" en vez de solo
 * cambiar de pregunta.
 */
export function ExerciseProgressBar({ completed, total }: ExerciseProgressBarProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const target = total === 0 ? 0 : Math.min(1, completed / total);

  useEffect(() => {
    progress.value = withSpring(target, { damping: 18, stiffness: 140 });
  }, [progress, target]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: completed }}
      style={[styles.track, { backgroundColor: colors.progressTrack }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors.success }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: controls.progressBarHeight,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
