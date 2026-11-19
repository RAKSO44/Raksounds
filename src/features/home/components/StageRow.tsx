import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Stage } from '@/domain/lessons';
import { PRESS_SLOP, resolveTone } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

import { stageTone } from '../stageTone';

interface StageRowProps {
  stage: Stage;
  current: boolean;
  onPress: () => void;
}

/**
 * Una etapa de la lista, como una tarjeta con relieve. La etapa en curso va
 * seleccionada como un `selectable` (cara tenue, borde y labio de su color);
 * el resto, neutras con su número en su color.
 *
 * El gesto es un Tap (no se activa al tocar, sino al soltar sin haberse
 * movido): así, arrastrar sobre una etapa desplaza la lista en vez de quedarse
 * pulsándola.
 */
export function StageRow({ stage, current, onPress }: StageRowProps) {
  const { colors } = useTheme();
  const tone = resolveTone(stageTone(stage.number), colors);
  const pressed = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(PRESS_SLOP)
        .runOnJS(true)
        .onBegin(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 1;
        })
        .onEnd((_event, success) => {
          if (!success) return;
          hapticPressIn();
          onPress();
        })
        .onFinalize(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 0;
        }),
    [pressed, onPress],
  );

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ selected: current }}
        accessibilityLabel={`Ir a la etapa ${stage.number}: ${stage.title}${
          current ? ' (etapa actual)' : ''
        }`}
      >
        <View
          style={[styles.lip, { backgroundColor: current ? tone.lip : colors.surfaceShadow }]}
        />
        <Animated.View
          style={[
            styles.face,
            current
              ? { backgroundColor: tone.tint, borderColor: tone.face }
              : { backgroundColor: colors.surface, borderColor: colors.border },
            faceStyle,
          ]}
        >
          <Text style={[styles.label, { color: tone.text }]}>Etapa {stage.number}</Text>
          <Text style={[styles.title, { color: current ? tone.text : colors.textPrimary }]}>
            {stage.title}
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: elevation.buttonLip,
    bottom: 0,
    borderRadius: radii.lg,
  },
  face: {
    marginBottom: elevation.buttonLip,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  label: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
  title: {
    ...typography.question,
    flexShrink: 0,
  },
});
