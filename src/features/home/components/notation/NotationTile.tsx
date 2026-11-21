import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';

import { Notation } from '@/domain/lessons';
import { controls, elevation, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { useFigureGesture } from '../../hooks/useFigureGesture';
import { NotationGlyph, notationLabel } from './NotationGlyph';

interface NotationTileProps {
  notation: Notation;
  /** Píxeles por espacio de pentagrama. */
  space: number;
  /** Pintada del color de marca: la solución que aparece al corregir. */
  highlighted?: boolean;
  /** Al tocarla (suena aquí, como una tecla). */
  onPressIn?: () => void;
  accessibilityLabel?: string;
}

/**
 * Figuras escritas en grande dentro de una ficha con relieve (mismo labio,
 * snap y háptica que un botón): lo que se pregunta en un ejercicio. Tocarla
 * la hace sonar.
 */
export function NotationTile({
  notation,
  space,
  highlighted = false,
  onPressIn,
  accessibilityLabel,
}: NotationTileProps) {
  const { colors } = useTheme();
  const { gesture, pressed } = useFigureGesture({ onPressIn });
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel ?? notationLabel(notation)}: escuchar`}
        onAccessibilityTap={onPressIn}
        style={styles.container}
      >
        <View
          style={[
            styles.lip,
            { backgroundColor: highlighted ? colors.brandShadow : colors.surfaceShadow },
          ]}
        />
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: highlighted ? colors.brandTint : colors.surface,
              borderColor: highlighted ? colors.brand : colors.border,
            },
            faceStyle,
          ]}
        >
          <NotationGlyph
            notation={notation}
            space={space}
            framed={false}
            color={highlighted ? colors.brandText : colors.textPrimary}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/**
 * El hueco de una ficha grande: lo que hay que adivinar. Mismo tamaño que
 * `NotationTile` (con su labio), borde discontinuo y un "?".
 */
export function NotationSlot({ accessibilityLabel }: { accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(motion.enter)}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.face,
        styles.slot,
        { borderColor: colors.secondary, backgroundColor: colors.secondaryTint },
      ]}
    >
      <Text style={[styles.question, { color: colors.secondaryText }]}>?</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: elevation.buttonLip,
    bottom: 0,
    borderRadius: radii.lg,
  },
  face: {
    minWidth: controls.figureCardSize,
    minHeight: controls.figureCardSize,
    marginBottom: elevation.buttonLip,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    borderStyle: 'dashed',
  },
  question: {
    ...typography.noteLarge,
    flexShrink: 0,
  },
});
