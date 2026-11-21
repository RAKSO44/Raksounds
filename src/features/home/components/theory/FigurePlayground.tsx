import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PLAYGROUND_BAR_UNITS } from '@/domain/lessons';
import { figureById, FigureId, FIGURES, FigureSpan } from '@/domain/rhythm';
import { controls, motion, spacing } from '@/shared/theme';

import { DragSource, useBarPlayground } from '../../hooks/useBarPlayground';
import { useFigureSound } from '../../hooks/useFigureSound';
import { FigureDrag, FingerPoint } from '../../hooks/useFigureGesture';
import { BAR_HEIGHT, FigureBox } from '../notation/FigureBox';
import { FigureTile } from '../notation/FigureTile';
import { RhythmBarView } from '../notation/RhythmBarView';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ancho que ocupa una figura en una barra de `barWidth` píxeles. */
const widthOf = (figure: FigureId, barWidth: number) =>
  (figureById(figure).units / PLAYGROUND_BAR_UNITS) * barWidth;

/**
 * Borde izquierdo de la copia (respecto al contenedor): centrada en el dedo,
 * pero sin salirse por los lados.
 */
function ghostLeft(fingerX: number, originX: number, ghostWidth: number, barWidth: number) {
  'worklet';
  const centered = fingerX - originX - ghostWidth / 2;
  return Math.min(Math.max(centered, 0), Math.max(0, barWidth - ghostWidth));
}

/**
 * "¡Experimenta un poco!": una barra que admite una redonda y, debajo, las
 * cinco figuras. Se arrastran (o se tocan) para llenarla; las de la paleta
 * no se acaban. La copia que viaja ya mide lo que la figura ocupará; al
 * acercarla a la barra, la figura se muestra en el sitio donde caería y las
 * demás se corren, y al alejarla todo vuelve a como estaba. Soltar aplica lo
 * que se ve. Dentro de la barra se reordenan igual y se quitan
 * manteniéndolas pulsadas. Si algo no cabe, la barra tiembla.
 */
export function FigurePlayground() {
  const playground = useBarPlayground(PLAYGROUND_BAR_UNITS);
  const { shown, previewing, hover, drop, add, remove, figureOf } = playground;
  const { play: playSound } = useFigureSound();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<DragSource | null>(null);

  const container = useRef<View>(null);
  const barView = useRef<View>(null);
  const barRect = useRef<Rect | null>(null);
  const widthRef = useRef(0);
  // Cerca de la barra: decide qué margen hay que cruzar para dejar de estarlo.
  const near = useRef(false);
  const finger = useSharedValue<FingerPoint>({ x: 0, y: 0 });
  const origin = useSharedValue<FingerPoint>({ x: 0, y: 0 });

  // Se mide al empezar cada arrastre (la página pudo desplazarse) y la copia
  // aparece recién entonces, para no pintarla un fotograma fuera de sitio.
  const dragFrom = useCallback(
    (source: DragSource): FigureDrag => ({
      finger,
      onStart: () => {
        near.current = false;
        barRect.current = null;
        barView.current?.measureInWindow((x, y, w, h) => {
          barRect.current = { x, y, width: w, height: h };
        });
        container.current?.measureInWindow((x, y) => {
          origin.value = { x, y };
          setDragging(source);
        });
      },
      onMove: (x, y) => {
        const rect = barRect.current;
        const figure = figureOf(source);
        const barWidth = widthRef.current;
        if (rect === null || figure === null || barWidth === 0) return;
        // Cuenta el centro de la copia, que flota por encima del dedo.
        const ghostWidth = widthOf(figure, barWidth);
        const centerX =
          origin.value.x + ghostLeft(x, origin.value.x, ghostWidth, barWidth) + ghostWidth / 2;
        const centerY = y - controls.dragGhostLift - BAR_HEIGHT / 2;
        const slop = near.current ? controls.dropExitSlop : controls.dropEnterSlop;
        near.current = centerY >= rect.y - slop && centerY <= rect.y + rect.height + slop;
        hover(
          source,
          near.current ? ((centerX - rect.x) / rect.width) * PLAYGROUND_BAR_UNITS : null,
        );
      },
      onEnd: (completed) => {
        setDragging(null);
        near.current = false;
        if (!completed) hover(source, null);
        drop(source);
      },
    }),
    [drop, figureOf, finger, hover, origin],
  );

  const paletteDrags = useMemo(
    () =>
      new Map(
        FIGURES.map((figure) => [figure.id, dragFrom({ kind: 'palette', figure: figure.id })]),
      ),
    [dragFrom],
  );
  const barDragFor = useCallback((key: number) => dragFrom({ kind: 'bar', key }), [dragFrom]);

  const playPlaced = useCallback((span: FigureSpan) => playSound(span.figure), [playSound]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playground.shake.value }],
  }));
  const ghostFigure = dragging === null ? null : figureOf(dragging);

  return (
    <View
      ref={container}
      collapsable={false}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
        setWidth(event.nativeEvent.layout.width);
      }}
      style={styles.container}
    >
      <Animated.View ref={barView} collapsable={false} style={shakeStyle}>
        {/* Hasta medir el ancho (un fotograma) la barra mide 0 y no se ve. */}
        <RhythmBarView
          bar={shown}
          width={width}
          // Lejos de la barra, una colocada se atenúa en su sitio; cerca, ya
          // se ve entera donde va a caer.
          draggingKey={dragging?.kind === 'bar' && !previewing ? dragging.key : null}
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
            accessibilityLabel={`${figure.name}. Toca para ponerla en la barra`}
            onPressIn={() => playSound(figure.id)}
            onPress={() => add(figure.id)}
            drag={paletteDrags.get(figure.id)}
          />
        ))}
      </View>

      {ghostFigure !== null && (
        <Ghost
          figure={ghostFigure}
          width={widthOf(ghostFigure, width)}
          barWidth={width}
          finger={finger}
          origin={origin}
          hidden={previewing}
        />
      )}
    </View>
  );
}

interface GhostProps {
  figure: FigureId;
  /** Lo que ocupará en la barra, en píxeles. */
  width: number;
  barWidth: number;
  finger: SharedValue<FingerPoint>;
  origin: SharedValue<FingerPoint>;
  /** Ya se muestra en su sitio dentro de la barra: la copia se aparta. */
  hidden: boolean;
}

/** La figura que viaja, con su recuadro a tamaño real, justo encima del dedo. */
function Ghost({ figure, width, barWidth, finger, origin, hidden }: GhostProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(hidden ? 0 : 1, { duration: motion.exit });
  }, [hidden, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: ghostLeft(finger.value.x, origin.value.x, width, barWidth) },
      { translateY: finger.value.y - origin.value.y - controls.dragGhostLift - BAR_HEIGHT },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.ghost, style]}>
      <FigureBox figure={figure} width={width} />
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
