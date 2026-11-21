import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PLAYGROUND_BAR_UNITS } from '@/domain/lessons';
import { FigureId, FIGURES, FigureSpan } from '@/domain/rhythm';
import { controls, spacing, useTheme } from '@/shared/theme';

import { DragSource, useBarPlayground } from '../../hooks/useBarPlayground';
import { useFigureSound } from '../../hooks/useFigureSound';
import { FigureDrag, FingerPoint } from '../../hooks/useFigureGesture';
import { FIGURE_FRAME, FramedFigureGlyph } from '../notation/FigureGlyph';
import { FigureTile } from '../notation/FigureTile';
import { RhythmBarView } from '../notation/RhythmBarView';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** La copia que viaja bajo el dedo, a tamaño de la paleta. */
const GHOST_SPACE = controls.figureSpaceTile;
const GHOST = {
  width: FIGURE_FRAME.width * GHOST_SPACE,
  height: (FIGURE_FRAME.above + FIGURE_FRAME.below) * GHOST_SPACE,
};
/** Margen por encima y por debajo de la barra que aún cuenta como "soltada en ella". */
const DROP_SLOP = spacing.lg;

/**
 * "¡Experimenta un poco!": una barra que admite una redonda y, debajo, las
 * cinco figuras. Se arrastran (o se tocan) para llenarla; las de la paleta
 * no se acaban. Dentro de la barra se intercambian arrastrando una sobre otra
 * y se quitan manteniéndolas pulsadas. Si algo no cabe, la barra tiembla.
 */
export function FigurePlayground() {
  const { colors } = useTheme();
  const playground = useBarPlayground(PLAYGROUND_BAR_UNITS);
  const { bar, drop, add, remove } = playground;
  const { sounding, play: playSound } = useFigureSound();
  const [soundingKey, setSoundingKey] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<DragSource | null>(null);

  const container = useRef<View>(null);
  const barView = useRef<View>(null);
  const barRect = useRef<Rect | null>(null);
  const finger = useSharedValue<FingerPoint>({ x: 0, y: 0 });
  const origin = useSharedValue<FingerPoint>({ x: 0, y: 0 });

  // Se mide al empezar cada arrastre (la página pudo desplazarse) y la copia
  // aparece recién entonces, para no pintarla un fotograma fuera de sitio.
  const dragFrom = useCallback(
    (source: DragSource): FigureDrag => ({
      finger,
      onStart: () => {
        barView.current?.measureInWindow((x, y, w, h) => {
          barRect.current = { x, y, width: w, height: h };
        });
        container.current?.measureInWindow((x, y) => {
          origin.value = { x, y };
          setDragging(source);
        });
      },
      onEnd: (x, y) => {
        setDragging(null);
        // Cuenta donde está la cabeza de la copia, que va por encima del dedo.
        const headY = y - FIGURE_FRAME.below * GHOST_SPACE;
        const rect = barRect.current;
        const inside =
          rect !== null &&
          x >= rect.x &&
          x <= rect.x + rect.width &&
          headY >= rect.y - DROP_SLOP &&
          headY <= rect.y + rect.height + DROP_SLOP;
        drop(source, inside ? ((x - rect.x) / rect.width) * PLAYGROUND_BAR_UNITS : null);
      },
    }),
    [drop, finger, origin],
  );

  const paletteDrags = useMemo(
    () =>
      new Map(
        FIGURES.map((figure) => [figure.id, dragFrom({ kind: 'palette', figure: figure.id })]),
      ),
    [dragFrom],
  );
  const barDragFor = useCallback((key: number) => dragFrom({ kind: 'bar', key }), [dragFrom]);

  const playPalette = (figure: FigureId) => {
    setSoundingKey(null);
    playSound(figure);
  };
  const playPlaced = useCallback(
    (span: FigureSpan) => {
      setSoundingKey(span.key);
      playSound(span.figure);
    },
    [playSound],
  );

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playground.shake.value }],
  }));
  const ghostFigure =
    dragging === null
      ? null
      : dragging.kind === 'palette'
        ? dragging.figure
        : (bar.figures.find((placed) => placed.key === dragging.key)?.figure ?? null);

  return (
    <View
      ref={container}
      collapsable={false}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.container}
    >
      <Animated.View ref={barView} collapsable={false} style={shakeStyle}>
        {/* Hasta medir el ancho (un fotograma) la barra mide 0 y no se ve. */}
        <RhythmBarView
          bar={bar}
          width={width}
          draggingKey={dragging?.kind === 'bar' ? dragging.key : null}
          soundingKey={sounding === null ? null : soundingKey}
          onPress={playPlaced}
          onRemove={remove}
          dragFor={barDragFor}
        />
      </Animated.View>

      <View style={styles.palette}>
        {FIGURES.map((figure) => (
          <FigureTile
            key={figure.id}
            figure={figure.id}
            space={controls.figureSpaceTile}
            active={soundingKey === null && sounding === figure.id}
            accessibilityLabel={`${figure.name}. Toca para ponerla en la barra`}
            onPressIn={() => playPalette(figure.id)}
            onPress={() => add(figure.id)}
            drag={paletteDrags.get(figure.id)}
          />
        ))}
      </View>

      {ghostFigure !== null && (
        <Ghost figure={ghostFigure} finger={finger} origin={origin} color={colors.brandText} />
      )}
    </View>
  );
}

interface GhostProps {
  figure: FigureId;
  finger: SharedValue<FingerPoint>;
  origin: SharedValue<FingerPoint>;
  color: string;
}

/** La figura que viaja: justo encima del dedo, para que el dedo no la tape. */
function Ghost({ figure, finger, origin, color }: GhostProps) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: finger.value.x - origin.value.x - GHOST.width / 2 },
      { translateY: finger.value.y - origin.value.y - GHOST.height },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.ghost, style]}>
      <FramedFigureGlyph figure={figure} space={GHOST_SPACE} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  palette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    elevation: 10,
  },
});
