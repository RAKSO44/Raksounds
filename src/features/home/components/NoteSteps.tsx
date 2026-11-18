import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { NOTE_NAMES } from '@/domain/lessons';
import { PRESS_SLOP, resolveTone } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

interface NoteStepsProps {
  /**
   * Qué barras llevan su nombre: todas (al corregir), solo DO como punto de
   * partida para contar, o ninguna (hay que reconocerla de oído).
   */
  labels: 'all' | 'anchor' | 'none';
  /** Barras pintadas. */
  lit: readonly number[];
  /** Cada barra suena al tocarla. */
  onPressStep: (index: number) => void;
}

function stepHeight(index: number): number {
  return controls.stepTileMinHeight + index * controls.stepTileRise;
}

/**
 * Las siete notas como una escalera: cada barra un poco más alta que la
 * anterior, porque cada nombre suena un poco más agudo. Es la imagen del
 * ORDEN, no de un instrumento. Toda barra suena al tocarla, y varias a la vez
 * suenan juntas.
 */
export function NoteSteps({ labels, lit, onPressStep }: NoteStepsProps) {
  return (
    <View style={styles.row}>
      {NOTE_NAMES.map((name, index) => {
        const shown = labels === 'all' || (labels === 'anchor' && index === 0);
        const on = lit.includes(index);
        return (
          <StepBar
            key={name}
            label={shown ? name : null}
            height={stepHeight(index)}
            lit={on}
            accessibilityLabel={
              shown ? `Nota ${name}` : on ? `Barra ${index + 1}, marcada` : `Barra ${index + 1}`
            }
            onPressIn={() => onPressStep(index)}
          />
        );
      })}
    </View>
  );
}

interface StepBarProps {
  label: string | null;
  height: number;
  lit: boolean;
  accessibilityLabel: string;
  onPressIn: () => void;
}

/**
 * Una barra: el relieve, snap y háptica de un `PushButton` seleccionable,
 * pero sin su relleno lateral (siete barras en un móvil dejan ~40 px cada
 * una: con el relleno del botón no cabía ni "SOL"). El nombre va arriba, a la
 * misma altura en todas, para que se lean en una línea.
 */
function StepBar({ label, height, lit, accessibilityLabel, onPressIn }: StepBarProps) {
  const { colors } = useTheme();
  const tone = resolveTone('brand', colors);
  const pressed = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(PRESS_SLOP)
        .runOnJS(true)
        .onBegin(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 1;
          hapticPressIn();
          onPressIn();
        })
        .onFinalize(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 0;
        }),
    [pressed, onPressIn],
  );

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ selected: lit }}
        accessibilityLabel={accessibilityLabel}
        onAccessibilityTap={onPressIn}
        style={styles.step}
      >
        <View style={[styles.lip, { backgroundColor: lit ? tone.lip : colors.surfaceShadow }]} />
        <Animated.View
          style={[
            styles.face,
            { height: height - elevation.buttonLip },
            lit
              ? { backgroundColor: tone.tint, borderColor: tone.face }
              : { backgroundColor: colors.surface, borderColor: colors.border },
            faceStyle,
          ]}
        >
          {label !== null && (
            <Text style={[styles.label, { color: lit ? tone.text : colors.textPrimary }]}>
              {label}
            </Text>
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  step: {
    flex: 1,
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
    marginBottom: elevation.buttonLip,
    paddingTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  label: {
    ...typography.chip,
    flexShrink: 0,
  },
});
