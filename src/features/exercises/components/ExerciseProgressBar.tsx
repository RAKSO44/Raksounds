import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { controls, motion, radii, spacing, useTheme } from '@/shared/theme';

interface ExerciseProgressBarProps {
  /** Ejercicios ya respondidos. */
  completed: number;
  total: number;
}

/**
 * Barra de progreso de la ronda, el elemento más reconocible de una lección de
 * Duolingo.
 *
 * El avance es corto y DIRECTO: una curva de salida que frena al llegar, sin
 * muelle ni rebote — la barra nunca se pasa del punto y vuelve. Sobre el
 * relleno va el "brillo" de Duolingo: una franja clara pegada al borde
 * superior que hace que la barra se lea como una pastilla con volumen en vez
 * de un rectángulo plano.
 */
export function ExerciseProgressBar({ completed, total }: ExerciseProgressBarProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const target = total === 0 ? 0 : Math.min(1, completed / total);

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: motion.progress,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, target]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: completed }}
      style={[styles.track, { backgroundColor: colors.progressTrack }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors.success }, fillStyle]}>
        <View style={[styles.shine, { backgroundColor: colors.progressShine }]} />
      </Animated.View>
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
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  shine: {
    height: controls.progressShineHeight,
    marginTop: controls.progressShineInset,
    marginHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
});
