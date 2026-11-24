import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { figureById, FigureId } from '@/domain/rhythm';
import { elevation, radii, spacing, useTheme } from '@/shared/theme';

import { FigureDrag, useFigureGesture } from '../../hooks/useFigureGesture';
import { FigureGlyph, FramedFigureGlyph, FramedItemGlyph } from './FigureGlyph';

interface FigureTileProps {
  figure: FigureId;
  /** Su silencio en vez de la figura (Módulo 4): se dibuja con su línea corta. */
  rest?: boolean;
  /** Píxeles por espacio de pentagrama (tamaño de la figura). */
  space: number;
  /**
   * Dentro del marco común (por defecto): todas las fichas miden igual y las
   * cabezas quedan a la misma altura, para ponerlas en fila. Sin él, la ficha
   * se ajusta a su figura (una sola por fila, como en la tabla).
   */
  framed?: boolean;
  /** Encendida (mientras suena): cara y figura del color de marca. */
  active?: boolean;
  onPressIn?: () => void;
  onPress?: () => void;
  /** Con esto la figura se puede arrastrar (viaja una copia, ver `FigureDrag`). */
  drag?: FigureDrag;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Una figura dentro de una ficha con relieve, como las fichas de nota de los
 * ejercicios: mismo labio, snap y háptica. La figura se dibuja en vectores;
 * la ficha solo dice "esto se toca".
 */
export function FigureTile({
  figure,
  rest = false,
  space,
  framed = true,
  active = false,
  onPressIn,
  onPress,
  drag,
  accessibilityLabel,
  style,
}: FigureTileProps) {
  const { colors } = useTheme();
  const { gesture, pressed } = useFigureGesture({ onPressIn, onPress, drag });
  const glyphColor = active ? colors.brandText : colors.textPrimary;
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ??
          (rest ? `Silencio de ${figureById(figure).name.toLowerCase()}` : figureById(figure).name)
        }
        accessibilityState={{ selected: active }}
        onAccessibilityTap={() => {
          onPressIn?.();
          onPress?.();
        }}
        style={style}
      >
        <View
          style={[
            styles.lip,
            { backgroundColor: active ? colors.brandShadow : colors.surfaceShadow },
          ]}
        />
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: active ? colors.brandTint : colors.surface,
              borderColor: active ? colors.brand : colors.border,
            },
            faceStyle,
          ]}
        >
          {rest ? (
            <FramedItemGlyph look={{ figure, rest }} space={space} color={glyphColor} />
          ) : framed ? (
            <FramedFigureGlyph figure={figure} space={space} color={glyphColor} />
          ) : (
            <FigureGlyph figure={figure} space={space} color={glyphColor} />
          )}
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
