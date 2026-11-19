import { useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Stage } from '@/domain/lessons';
import { PRESS_SLOP, resolveTone } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, elevation, radii, spacing, useTheme } from '@/shared/theme';

import { STAGE_CHANGE, useStageChange } from '../hooks/useStageChange';
import { stageTone } from '../stageTone';
import { StageCardHeader } from './StageCardHeader';

/** Aire de la franja que rodea la tarjeta (arriba y abajo). */
const PAD_TOP = spacing.md;
const PAD_BOTTOM = spacing.sm;

interface StageBannerProps {
  stages: readonly Stage[];
  /** Índice de la etapa que se está recorriendo. */
  current: number;
  /** Se tocó la tarjeta: abre la pantalla con todas las etapas. */
  onOpen: () => void;
  /** Alto que ocupa la tarjeta (lo que tapa de la ruta) y la etapa medida. */
  onHeight: (height: number, stageIndex: number) => void;
}

/**
 * La tarjeta fija de etapa, como la de las secciones de Duolingo: siempre una
 * sola, arriba, con la etapa que se está recorriendo; al pasar a la siguiente
 * cambia de texto y de color. Tocarla abre la pantalla de etapas
 * (`StagesScreen`).
 */
export function StageBanner({ stages, current, onOpen, onHeight }: StageBannerProps) {
  const { colors } = useTheme();
  const stage = stages[current] ?? stages[0];
  const tone = resolveTone(stageTone(stage.number), colors);
  const { blend, from, to, forward } = useStageChange(current, tone.face, tone.lip);
  const pressed = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    // La primera medida se fija; las siguientes (un título que ocupa otra
    // cantidad de líneas) se animan, para que la tarjeta no salte de alto.
    headerHeight.value = headerHeight.value > 0 ? withTiming(height, STAGE_CHANGE) : height;
    onHeight(PAD_TOP + height + elevation.buttonLip + PAD_BOTTOM, current);
  };

  const faceStyle = useAnimatedStyle(() => ({
    // Sin medir aún, la tarjeta toma el alto de su encabezado por sí sola.
    height: headerHeight.value > 0 ? headerHeight.value : undefined,
    backgroundColor: interpolateColor(blend.value, [0, 1], [from.face, to.face]),
    transform: [{ translateY: pressed.value * elevation.buttonLip }],
  }));
  const lipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(blend.value, [0, 1], [from.lip, to.lip]),
  }));

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(PRESS_SLOP)
        .runOnJS(true)
        .onBegin(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 1;
          hapticPressIn();
        })
        .onEnd((_event, success) => {
          if (success) onOpen();
        })
        .onFinalize(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 0;
        }),
    [pressed, onOpen],
  );

  return (
    <View style={[styles.strip, { backgroundColor: colors.background }]}>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          accessibilityLabel={`Etapa ${stage.number}: ${stage.title}. Ver todas las etapas`}
          style={styles.column}
        >
          <Animated.View style={[styles.lip, lipStyle]} />
          <Animated.View style={[styles.face, faceStyle]}>
            <View onLayout={onHeaderLayout}>
              <StageCardHeader stage={stage} forward={forward} color={tone.onFace} />
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
  },
  column: {
    width: '100%',
    maxWidth: controls.pathMaxWidth - spacing.md * 2,
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
    marginBottom: elevation.buttonLip,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
});
