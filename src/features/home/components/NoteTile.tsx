import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PRESS_SLOP, PushButtonTone, resolveTone } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

/** Lo que hay que mover el dedo para que tocar pase a ser arrastrar. */
const DRAG_START = 6;

/** Arrastre de una ficha, con la posición del dedo en la ventana. */
export interface TileDrag {
  onStart: () => void;
  onEnd: (x: number, y: number) => void;
}

interface NoteTileProps {
  label: string;
  tone?: PushButtonTone;
  /** Pintada del color del tono (la ficha "encendida"). */
  selected?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Al tocar (suena aquí: una tecla suena en cuanto se pulsa). */
  onPressIn?: () => void;
  /** Tap completo, sin arrastre. */
  onPress?: () => void;
  /** Con esto la ficha se puede arrastrar, y se ve viajar bajo el dedo. */
  drag?: TileDrag;
}

/**
 * Una ficha de nota de los ejercicios: el mismo relieve 3D, snap y háptica que
 * `PushButton` (variante `selectable`), con un tamaño fijo de casilla y, si se
 * le pasa `drag`, arrastrable. Tocar y arrastrar compiten: si el dedo se mueve
 * antes de soltar, es un arrastre y la ficha viaja con él (por encima de todo
 * lo demás); si no, es un toque.
 *
 * Cada ficha tiene su propio gesto, así que varias se pueden pulsar a la vez y
 * sus notas suenan juntas.
 */
export function NoteTile({
  label,
  tone = 'secondary',
  selected = false,
  disabled = false,
  accessibilityLabel,
  onPressIn,
  onPress,
  drag,
}: NoteTileProps) {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragging = useSharedValue(0);

  /* eslint-disable react-hooks/immutability -- mutar .value es la API de shared values de reanimated */
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDistance(PRESS_SLOP)
      .enabled(!disabled)
      .runOnJS(true)
      .onBegin(() => {
        pressed.value = 1;
        hapticPressIn();
        onPressIn?.();
      })
      .onEnd((_event, success) => {
        if (success) onPress?.();
      })
      .onFinalize(() => {
        pressed.value = 0;
      });
    if (drag === undefined) return tap;

    const pan = Gesture.Pan()
      .minDistance(DRAG_START)
      .enabled(!disabled)
      .onStart(() => {
        pressed.value = 0;
        dragging.value = 1;
        runOnJS(drag.onStart)();
      })
      .onUpdate((event) => {
        dragX.value = event.translationX;
        dragY.value = event.translationY;
      })
      .onEnd((event) => {
        runOnJS(drag.onEnd)(event.absoluteX, event.absoluteY);
      })
      .onFinalize(() => {
        // Vuelve a su sitio al instante: si cayó en un hueco, el nuevo estado
        // ya la pinta allí en el mismo fotograma.
        dragX.value = 0;
        dragY.value = 0;
        dragging.value = 0;
      });
    return Gesture.Race(pan, tap);
  }, [disabled, drag, onPress, onPressIn, pressed, dragX, dragY, dragging]);

  /* eslint-enable react-hooks/immutability */

  const containerStyle = useAnimatedStyle(() => ({
    zIndex: dragging.value === 1 ? 10 : 0,
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  const toneColors = resolveTone(tone, colors);
  const face = disabled ? colors.disabledSurface : selected ? toneColors.tint : colors.surface;
  const lip = disabled ? colors.disabledSurface : selected ? toneColors.lip : colors.surfaceShadow;
  const border = disabled ? colors.disabledSurface : selected ? toneColors.face : colors.border;
  const text = disabled ? colors.disabledText : selected ? toneColors.text : colors.textPrimary;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        accessibilityLabel={accessibilityLabel ?? label}
        onAccessibilityTap={() => {
          if (disabled) return;
          onPressIn?.();
          onPress?.();
        }}
        style={[styles.container, containerStyle]}
      >
        <View style={[styles.lip, { backgroundColor: lip }]} />
        <Animated.View
          style={[styles.face, { backgroundColor: face, borderColor: border }, faceStyle]}
        >
          <Text style={[styles.label, { color: text }]}>{label}</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: controls.noteCellSize,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: elevation.buttonLip,
    bottom: 0,
    borderRadius: radii.md,
  },
  face: {
    height: controls.noteCellSize,
    marginBottom: elevation.buttonLip,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.note,
    flexShrink: 0,
  },
});

/**
 * El hueco de una ficha: mismo tamaño que `NoteTile`, con borde discontinuo.
 * `label` lo marca ("?") cuando es lo que hay que adivinar.
 */
export function TileSlot({
  label,
  accessibilityLabel,
}: {
  label?: string;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.face,
        slotStyles.slot,
        {
          borderColor: label === undefined ? colors.border : colors.secondary,
          backgroundColor: label === undefined ? 'transparent' : colors.secondaryTint,
        },
      ]}
    >
      {label !== undefined && (
        <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
      )}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  slot: {
    minWidth: controls.noteCellSize,
    borderStyle: 'dashed',
  },
});
