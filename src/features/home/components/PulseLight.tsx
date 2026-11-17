import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { controls, motion, radii, useTheme } from '@/shared/theme';

interface PulseLightProps {
  /**
   * Contador de golpes: cada vez que cambia, la luz se enciende. Es un
   * contador (no un índice) para que dos golpes seguidos con el mismo índice
   * —al repetir un clip— también destellen.
   */
  pulseCount: number;
  /** Destellar o quedarse quieta (golpes sin guía visual). */
  enabled?: boolean;
  size?: number;
}

/**
 * El pulso hecho luz: un círculo que se ENCIENDE de golpe con cada golpe y se
 * apaga con una curva corta. No cambia de tamaño —la escala animada está
 * prohibida en el sistema de diseño—: el pulso se nota por color.
 */
export function PulseLight({
  pulseCount,
  enabled = true,
  size = controls.pulseLightSize,
}: PulseLightProps) {
  const { colors } = useTheme();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!enabled || pulseCount === 0) return;
    glow.value = 1;
    glow.value = withTiming(0, { duration: motion.flash, easing: Easing.out(Easing.cubic) });
  }, [pulseCount, enabled, glow]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.light,
        {
          width: size,
          height: size,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View style={[styles.glow, { backgroundColor: colors.brand }, glowStyle]} />
      <MaterialCommunityIcons name="metronome" size={size / 2.5} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  light: {
    borderRadius: radii.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFill,
  },
});
