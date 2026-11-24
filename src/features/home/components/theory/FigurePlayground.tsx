import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PLAYGROUND_BAR_UNITS } from '@/domain/lessons';
import {
  FigureGlyph as Glyph,
  figureById,
  FigureId,
  FIGURES,
  FigureSpan,
  itemUnits,
  noteItem,
  phraseGlyph,
  restItem,
  RhythmBar,
  RhythmItem,
} from '@/domain/rhythm';
import { controls, motion, spacing } from '@/shared/theme';

import { Playhead } from '../../hooks/useBarPlayback';
import { DraggedLook, DragSource, useBarPlayground } from '../../hooks/useBarPlayground';
import { useFigureSound } from '../../hooks/useFigureSound';
import { FigureDrag, FingerPoint } from '../../hooks/useFigureGesture';
import { BAR_HEIGHT, FigureBox } from '../notation/FigureBox';
import { FigureTile } from '../notation/FigureTile';
import { GlyphToggle } from '../notation/GlyphToggle';
import { PlayheadLine } from '../notation/PlayheadLine';
import { RhythmBarView } from '../notation/RhythmBarView';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ancho que ocupa algo escrito en una barra de `barWidth` píxeles. */
const widthOf = (look: DraggedLook, barWidth: number) =>
  (itemUnits(look) / PLAYGROUND_BAR_UNITS) * barWidth;

const ALL_FIGURES: readonly FigureId[] = FIGURES.map((figure) => figure.id);
const NONE: readonly FigureId[] = [];

/** Lo que hace tocar una figura de la barra: ponerle o quitarle algo (sin herramienta, suena). */
type Tool = 'dot' | 'tie';
const TOOLS: readonly Tool[] = ['dot', 'tie'];

/** Los dibujos de las herramientas: una negra con puntillo y dos negras ligadas. */
const QUARTER = { figure: figureById('quarter'), rest: false, dotted: false };
const TOOL_GLYPHS: Record<Tool, Glyph> = {
  dot: phraseGlyph([{ ...QUARTER, dotted: true }], []),
  tie: phraseGlyph([QUARTER, QUARTER], [true]),
};
const TOOL_LABELS: Record<Tool, string> = {
  dot: 'Puntillo: toca una figura de la barra para ponérselo o quitárselo',
  tie: 'Ligadura: toca una nota de la barra para ligarla con la siguiente',
};

interface FigurePlaygroundProps {
  /** Las figuras de abajo (todas, por defecto). No se acaban. */
  palette?: readonly FigureId[];
  /** Las que la barra ya trae y no se pueden quitar (un ejercicio a completar). */
  given?: readonly FigureId[];
  /** Ya se corrigió: la barra solo se escucha y la paleta desaparece. */
  disabled?: boolean;
  /** Cada vez que la barra cambia. */
  onChange?: (bar: RhythmBar) => void;
  /** Las figuras suenan sobre el pulso (la práctica). */
  pulse?: boolean;
  /** Justo antes de que suene una figura tocada (corta otra reproducción). */
  onSound?: () => void;
  /** Mientras la barra entera se reproduce, una línea roja la recorre. */
  playhead?: Playhead | null;
  /** Debajo de las figuras, sus silencios (Módulo 4). */
  rests?: boolean;
  /** El puntillo y la ligadura como herramientas (Módulo 4). */
  modifiers?: boolean;
}

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
 * cinco figuras (y, en el Módulo 4, sus silencios). Se arrastran (o se tocan)
 * para llenarla; las de la paleta no se acaban. La copia que viaja ya mide lo
 * que la figura ocupará; al acercarla a la barra, la figura se muestra en el
 * sitio donde caería y las demás se corren, y al alejarla todo vuelve a como
 * estaba. Soltar aplica lo que se ve. Dentro de la barra se reordenan igual y
 * se quitan manteniéndolas pulsadas. Con el puntillo o la ligadura
 * encendidos, tocar una figura de la barra se lo pone o se lo quita. Si algo
 * no cabe (o no se puede), la barra tiembla.
 */
export function FigurePlayground({
  palette = ALL_FIGURES,
  given = NONE,
  disabled = false,
  onChange,
  pulse = false,
  onSound,
  playhead = null,
  rests = false,
  modifiers = false,
}: FigurePlaygroundProps) {
  const playground = useBarPlayground(PLAYGROUND_BAR_UNITS, given);
  const { bar, shown, previewing, hover, drop, add, remove, dot, tie, lookOf } = playground;
  const [tool, setTool] = useState<Tool | null>(null);

  useEffect(() => {
    onChange?.(bar);
  }, [bar, onChange]);
  const { playItem } = useFigureSound(pulse);
  const playSound = useCallback(
    (item: RhythmItem) => {
      onSound?.();
      playItem(item);
    },
    [onSound, playItem],
  );
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
        const look = lookOf(source);
        const barWidth = widthRef.current;
        if (rect === null || look === null || barWidth === 0) return;
        // Cuenta el centro de la copia, que flota por encima del dedo.
        const ghostWidth = widthOf(look, barWidth);
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
    [drop, lookOf, finger, hover, origin],
  );

  const paletteDrags = useMemo(
    () => new Map(palette.map((figure) => [figure, dragFrom({ kind: 'palette', figure })])),
    [dragFrom, palette],
  );
  const restDrags = useMemo(
    () =>
      new Map(palette.map((figure) => [figure, dragFrom({ kind: 'palette', figure, rest: true })])),
    [dragFrom, palette],
  );
  const barDragFor = useCallback((key: number) => dragFrom({ kind: 'bar', key }), [dragFrom]);

  // Con una herramienta encendida, tocar una figura de la barra la aplica en vez de sonar.
  const pressPlaced = useCallback(
    (span: FigureSpan) => {
      if (disabled || tool === null) playSound(span);
      else if (tool === 'dot') dot(span.key);
      else tie(span.key);
    },
    [disabled, dot, playSound, tie, tool],
  );

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playground.shake.value }],
  }));
  const ghostLook = dragging === null ? null : lookOf(dragging);
  // Con pocas figuras, juntas al centro; las cinco, de borde a borde.
  const paletteStyle = [styles.palette, palette.length < ALL_FIGURES.length && styles.paletteFew];

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
          onPress={pressPlaced}
          onRemove={disabled ? undefined : remove}
          dragFor={disabled ? undefined : barDragFor}
        />
        {playhead !== null && width > 0 && (
          <PlayheadLine playhead={playhead} width={width} height={BAR_HEIGHT} />
        )}
      </Animated.View>

      {!disabled && (
        <View style={paletteStyle}>
          {palette.map((figure) => (
            <FigureTile
              key={figure}
              figure={figure}
              space={controls.figureSpaceTile}
              accessibilityLabel={`${figureById(figure).name}. Toca para ponerla en la barra`}
              onPressIn={() => playSound(noteItem(figure))}
              onPress={() => add(figure)}
              drag={paletteDrags.get(figure)}
            />
          ))}
        </View>
      )}

      {!disabled && rests && (
        <View style={paletteStyle}>
          {palette.map((figure) => (
            <FigureTile
              key={figure}
              figure={figure}
              rest
              space={controls.figureSpaceTile}
              accessibilityLabel={`Silencio de ${figureById(figure).name.toLowerCase()}. Toca para ponerlo en la barra`}
              onPressIn={() => playSound(restItem(figure))}
              onPress={() => add(figure, undefined, true)}
              drag={restDrags.get(figure)}
            />
          ))}
        </View>
      )}

      {!disabled && modifiers && (
        <View style={styles.tools}>
          {TOOLS.map((option) => (
            <GlyphToggle
              key={option}
              glyph={TOOL_GLYPHS[option]}
              space={controls.figureSpaceTile}
              on={tool === option}
              accessibilityLabel={TOOL_LABELS[option]}
              // Una a la vez: encender una apaga la otra.
              onToggle={() => setTool((current) => (current === option ? null : option))}
            />
          ))}
        </View>
      )}

      {ghostLook !== null && (
        <Ghost
          look={ghostLook}
          width={widthOf(ghostLook, width)}
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
  look: DraggedLook;
  /** Lo que ocupará en la barra, en píxeles. */
  width: number;
  barWidth: number;
  finger: SharedValue<FingerPoint>;
  origin: SharedValue<FingerPoint>;
  /** Ya se muestra en su sitio dentro de la barra: la copia se aparta. */
  hidden: boolean;
}

/** La figura que viaja, con su recuadro a tamaño real, justo encima del dedo. */
function Ghost({ look, width, barWidth, finger, origin, hidden }: GhostProps) {
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
      <FigureBox figure={look.figure} rest={look.rest} dotted={look.dotted} width={width} />
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
  paletteFew: {
    justifyContent: 'center',
    gap: spacing.lg,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    elevation: 10,
  },
});
