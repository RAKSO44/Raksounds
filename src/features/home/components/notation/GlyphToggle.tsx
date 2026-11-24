import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { FigureGlyph as Glyph } from '@/domain/rhythm';
import { elevation, radii, spacing, useTheme } from '@/shared/theme';

import { useFigureGesture } from '../../hooks/useFigureGesture';
import { GlyphSvg } from './FigureGlyph';

interface GlyphToggleProps {
  /** Lo que se dibuja en la ficha (una figura con puntillo, dos notas ligadas…). */
  glyph: Glyph;
  /** Píxeles por espacio. */
  space: number;
  /** Encendido: lo que agrega (el puntillo, la ligadura) se pinta en rojo. */
  on: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
}

/**
 * Un interruptor dibujado: una ficha con relieve (mismo labio, snap y
 * háptica que un botón) que se enciende y se apaga. Apagado es neutro;
 * encendido toma el rojo de lo que PROLONGA un sonido, el mismo color con el
 * que se pinta en la línea lo que agrega.
 */
export function GlyphToggle({ glyph, space, on, onToggle, accessibilityLabel }: GlyphToggleProps) {
  const { colors } = useTheme();
  const { gesture, pressed } = useFigureGesture({ onPress: onToggle });
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: on }}
        onAccessibilityTap={onToggle}
      >
        <View
          style={[
            styles.lip,
            { backgroundColor: on ? colors.prolongationShadow : colors.surfaceShadow },
          ]}
        />
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: on ? colors.prolongationTint : colors.surface,
              borderColor: on ? colors.prolongation : colors.border,
            },
            faceStyle,
          ]}
        >
          <GlyphSvg
            glyph={glyph}
            space={space}
            color={on ? colors.prolongationText : colors.textPrimary}
            markColor={on ? colors.prolongation : colors.textSecondary}
          />
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
    borderRadius: radii.md,
  },
  face: {
    marginBottom: elevation.buttonLip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
