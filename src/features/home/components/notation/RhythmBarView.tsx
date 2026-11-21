import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { FigureSpan, figureById, RhythmBar, figureSpans } from '@/domain/rhythm';
import { controls, motion, useTheme } from '@/shared/theme';

import { FigureDrag, useFigureGesture } from '../../hooks/useFigureGesture';
import { BAR_HEIGHT, BAR_LINE_Y, FigureBox } from './FigureBox';

const SHIFT = LinearTransition.duration(motion.figureShift).easing(Easing.out(Easing.cubic));

interface RhythmBarViewProps {
  bar: RhythmBar;
  /** Ancho de la barra en píxeles: cada figura ocupa su parte de él. */
  width: number;
  /** La figura colocada que se está arrastrando lejos de la barra (se atenúa en su sitio). */
  draggingKey?: number | null;
  onPress: (span: FigureSpan) => void;
  /** Sin esto (y sin `dragFor`) la barra solo se mira y se escucha: ya se corrigió. */
  onRemove?: (key: number) => void;
  dragFor?: (key: number) => FigureDrag;
}

/**
 * Una barra rítmica dibujada: una línea con un tope en cada extremo y, sobre
 * ella, las figuras colocadas. Cada una va en un recuadro de su color del
 * ancho que le toca por su duración, así se VE cuánto ocupa. Al insertar,
 * quitar o mover, las demás se corren a su nuevo sitio (sin saltos).
 */
export function RhythmBarView({
  bar,
  width,
  draggingKey = null,
  onPress,
  onRemove,
  dragFor,
}: RhythmBarViewProps) {
  const { colors } = useTheme();
  const line = { backgroundColor: colors.textPrimary };

  return (
    <View style={[styles.bar, { width }]}>
      {figureSpans(bar).map((span) => (
        <PlacedFigure
          key={span.key}
          span={span}
          width={(span.units / bar.capacity) * width}
          dimmed={draggingKey === span.key}
          onPress={onPress}
          onRemove={onRemove}
          dragFor={dragFor}
        />
      ))}
      {/* La línea va por encima de los recuadros: las cabezas se apoyan en ella. */}
      <View pointerEvents="none" style={[styles.line, line]} />
      <View pointerEvents="none" style={[styles.tick, styles.start, line]} />
      <View pointerEvents="none" style={[styles.tick, styles.end, line]} />
    </View>
  );
}

interface PlacedFigureProps {
  span: FigureSpan;
  width: number;
  dimmed: boolean;
  onPress: (span: FigureSpan) => void;
  onRemove?: (key: number) => void;
  dragFor?: (key: number) => FigureDrag;
}

/**
 * Una figura colocada: tocarla suena, mantenerla la quita, arrastrarla la
 * mueve. Una fija (venía puesta) no se arrastra; mantenerla avisa que no se
 * quita.
 */
const PlacedFigure = memo(function PlacedFigure({
  span,
  width,
  dimmed,
  onPress,
  onRemove,
  dragFor,
}: PlacedFigureProps) {
  const { key, locked } = span;
  const drag = useMemo(
    () => (locked || dragFor === undefined ? undefined : dragFor(key)),
    [dragFor, key, locked],
  );
  // Sin labio no hay cara que hundir: tocarla solo da la háptica.
  const { gesture } = useFigureGesture({
    onPress: () => onPress(span),
    onLongPress: onRemove === undefined ? undefined : () => onRemove(key),
    drag,
  });
  const name = figureById(span.figure).name;
  const removable = onRemove !== undefined && !locked;

  return (
    <Animated.View
      layout={SHIFT}
      entering={FadeIn.duration(motion.enter)}
      exiting={FadeOutDown.duration(motion.exit)}
      style={dimmed && styles.dimmed}
    >
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={removable ? `${name}. Mantenla presionada para quitarla` : name}
          accessibilityActions={removable ? [{ name: 'delete', label: 'Quitar' }] : undefined}
          onAccessibilityAction={() => onRemove?.(key)}
          onAccessibilityTap={() => onPress(span)}
        >
          <FigureBox figure={span.figure} width={width} />
        </View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BAR_LINE_Y - controls.rhythmBarStroke / 2,
    height: controls.rhythmBarStroke,
  },
  tick: {
    position: 'absolute',
    top: BAR_LINE_Y - controls.rhythmBarTickHeight / 2,
    width: controls.rhythmBarStroke,
    height: controls.rhythmBarTickHeight,
  },
  start: {
    left: 0,
  },
  end: {
    right: 0,
  },
  dimmed: {
    opacity: controls.dragSourceOpacity,
  },
});
