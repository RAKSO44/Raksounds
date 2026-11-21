import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { FigureSpan, figureById, RhythmBar, figureSpans, isFull } from '@/domain/rhythm';
import { controls, motion, radii, useTheme } from '@/shared/theme';

import { FigureDrag, useFigureGesture } from '../../hooks/useFigureGesture';
import { FIGURE_FRAME, FigureGlyph, glyphOf } from './FigureGlyph';

const SPACE = controls.figureSpaceBar;
const HEIGHT = controls.rhythmBarHeight;
/** Altura de la línea: donde se apoyan las cabezas, con el marco común centrado. */
const LINE_Y =
  (HEIGHT - (FIGURE_FRAME.above + FIGURE_FRAME.below) * SPACE) / 2 + FIGURE_FRAME.above * SPACE;
/** Lo que el contenido de un recuadro queda corrido respecto a la barra (margen + borde). */
const BOX_BORDER = 2;
const BOX_OFFSET = controls.rhythmBarBoxInset + BOX_BORDER;
/** Aire entre el borde del recuadro y la cabeza, en espacios. */
const HEAD_INSET = 1.5;
const SHIFT = LinearTransition.duration(motion.figureShift).easing(Easing.out(Easing.cubic));

interface RhythmBarViewProps {
  bar: RhythmBar;
  /** Ancho de la barra en píxeles: cada figura ocupa su parte de él. */
  width: number;
  /** La figura colocada que se está arrastrando (se atenúa en su sitio). */
  draggingKey: number | null;
  /** La figura colocada que suena ahora. */
  soundingKey: number | null;
  onPress: (span: FigureSpan) => void;
  onRemove: (key: number) => void;
  dragFor: (key: number) => FigureDrag;
}

/**
 * Una barra rítmica dibujada: una línea con un tope en cada extremo y, sobre
 * ella, las figuras colocadas. Cada una va en un recuadro del ancho que le
 * toca por su duración, así se VE cuánto ocupa. Al insertar, quitar o
 * intercambiar, las demás se corren a su nuevo sitio (sin saltos); al
 * llenarse, la línea se vuelve verde.
 */
export function RhythmBarView({
  bar,
  width,
  draggingKey,
  soundingKey,
  onPress,
  onRemove,
  dragFor,
}: RhythmBarViewProps) {
  const { colors } = useTheme();
  const line = isFull(bar) ? colors.success : colors.textPrimary;

  return (
    <View style={[styles.bar, { width }]}>
      <View style={[styles.line, { backgroundColor: line }]} />
      <View style={[styles.tick, styles.start, { backgroundColor: line }]} />
      <View style={[styles.tick, styles.end, { backgroundColor: line }]} />
      {figureSpans(bar).map((span) => (
        <PlacedFigure
          key={span.key}
          span={span}
          width={(span.units / bar.capacity) * width}
          dimmed={draggingKey === span.key}
          sounding={soundingKey === span.key}
          onPress={onPress}
          onRemove={onRemove}
          dragFor={dragFor}
        />
      ))}
    </View>
  );
}

interface PlacedFigureProps {
  span: FigureSpan;
  width: number;
  dimmed: boolean;
  sounding: boolean;
  onPress: (span: FigureSpan) => void;
  onRemove: (key: number) => void;
  dragFor: (key: number) => FigureDrag;
}

/** Una figura colocada: tocarla suena, mantenerla la quita, arrastrarla la mueve. */
const PlacedFigure = memo(function PlacedFigure({
  span,
  width,
  dimmed,
  sounding,
  onPress,
  onRemove,
  dragFor,
}: PlacedFigureProps) {
  const { colors } = useTheme();
  const { key } = span;
  const drag = useMemo(() => dragFor(key), [dragFor, key]);
  // Sin labio no hay cara que hundir: tocarla solo da la háptica.
  const { gesture } = useFigureGesture({
    onPress: () => onPress(span),
    onLongPress: () => onRemove(key),
    drag,
  });

  const glyph = glyphOf(span.figure);
  // La cabeza va al principio de su espacio (ahí empieza a sonar); si el
  // recuadro es angosto, la figura se centra.
  const left = Math.min(SPACE * HEAD_INSET, Math.max(0, (width - glyph.width * SPACE) / 2));
  const name = figureById(span.figure).name;

  return (
    <Animated.View
      layout={SHIFT}
      entering={FadeIn.duration(motion.enter)}
      exiting={FadeOutDown.duration(motion.exit)}
      style={[styles.slot, { width }, dimmed && styles.dimmed]}
    >
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${name}. Mantenla presionada para quitarla`}
          accessibilityActions={[{ name: 'delete', label: 'Quitar' }]}
          onAccessibilityAction={() => onRemove(key)}
          onAccessibilityTap={() => onPress(span)}
          style={[
            styles.box,
            {
              borderColor: sounding ? colors.brand : colors.secondary,
              backgroundColor: sounding ? colors.brandTint : undefined,
            },
          ]}
        >
          <View style={[styles.glyph, { left, top: LINE_Y - glyph.head.y * SPACE - BOX_OFFSET }]}>
            <FigureGlyph
              figure={span.figure}
              space={SPACE}
              color={sounding ? colors.brandText : colors.textPrimary}
            />
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bar: {
    height: HEIGHT,
    flexDirection: 'row',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: LINE_Y - controls.rhythmBarStroke / 2,
    height: controls.rhythmBarStroke,
  },
  tick: {
    position: 'absolute',
    top: LINE_Y - controls.rhythmBarTickHeight / 2,
    width: controls.rhythmBarStroke,
    height: controls.rhythmBarTickHeight,
  },
  start: {
    left: 0,
  },
  end: {
    right: 0,
  },
  slot: {
    height: HEIGHT,
  },
  dimmed: {
    opacity: controls.dragSourceOpacity,
  },
  box: {
    flex: 1,
    margin: controls.rhythmBarBoxInset,
    borderWidth: BOX_BORDER,
    borderStyle: 'dashed',
    borderRadius: radii.sm,
  },
  glyph: {
    position: 'absolute',
  },
});
