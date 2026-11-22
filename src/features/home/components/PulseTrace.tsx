import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { controls, motion, radii, spacing, useTheme } from '@/shared/theme';

import { BeatFigure, HeardBeat } from '../hooks/usePulseLoop';
import { FIGURE_FRAME, FigureGlyph, glyphOf } from './notation/FigureGlyph';

/** Tope de marcas montadas a la vez: a 200 BPM cruzan unas 8. */
const MAX_TICKS = 10;
/** Tramo final de la línea en el que la marca se desvanece. */
const FADE_FROM = 0.85;

interface Tick {
  id: number;
  accent: boolean;
  figures: readonly BeatFigure[];
  /** Cuándo nació (reloj de `performance.now()`): pasado `traceCross` ya no se ve. */
  bornAt: number;
}

/** Alto de la línea, dónde va su trazo y cuánto miden las marcas débil y fuerte. */
interface TraceLayout {
  height: number;
  baselineY: number;
  tick: number;
  accentTick: number;
}

/** El oxímetro del Módulo 2: el trazo al centro y marcas altas. */
const PULSE_LAYOUT: TraceLayout = {
  height: controls.pulseTraceHeight,
  baselineY: controls.pulseTraceHeight / 2,
  tick: controls.pulseTickHeight,
  accentTick: controls.pulseAccentTickHeight,
};

/**
 * Con figuras (Módulo 3) las protagonistas son ellas: marcas más bajas y sitio
 * sobre el trazo para la plica y los corchetes. El trazo queda al centro, así
 * lo que se pone al lado (el botón de reproducir) se alinea con él.
 */
const FIGURE_LAYOUT: TraceLayout = (() => {
  const baselineY = Math.ceil(FIGURE_FRAME.above * controls.pulseTraceFigureSpace) + spacing.xs;
  return {
    height: baselineY * 2,
    baselineY,
    tick: controls.figureTraceTickHeight,
    accentTick: controls.figureTraceAccentTickHeight,
  };
})();

interface PulseTraceProps {
  beat: HeardBeat;
  /**
   * Las figuras que traen los golpes van dibujadas encima de su marca (Módulo
   * 3). Cambia las proporciones de la línea para que se lean bien.
   */
  withFigures?: boolean;
}

/**
 * La línea del pulso, como un oxímetro: cada golpe deja una marca que nace
 * junto al corazón y avanza por la línea a velocidad CONSTANTE. Por eso la
 * distancia entre marcas es el tempo hecho espacio: siempre igual con un
 * pulso regular, y más juntas cuanto más rápido. Los golpes fuertes dejan una
 * marca más alta.
 *
 * Las figuras de un golpe viajan DENTRO de su marca (no con un reloj propio):
 * la que suena con el golpe va justo sobre ella, y las de en medio (la
 * segunda corchea, las semicorcheas) detrás, a la distancia que el tiempo
 * recorre hasta que suenan. Como la línea se recorta por la izquierda, cada
 * una asoma recién cuando suena, y nunca puede desalinearse de su pulso.
 */
export function PulseTrace({ beat, withFigures = false }: PulseTraceProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [ticks, setTicks] = useState<readonly Tick[]>([]);
  const [seen, setSeen] = useState(beat.count);
  const layout = withFigures ? FIGURE_LAYOUT : PULSE_LAYOUT;

  // Un golpe nuevo deja su marca (ajuste de estado al cambiar la prop, sin efecto).
  // Las que ya cruzaron se desmontan: no quedan vistas invisibles animándose.
  if (beat.count !== seen) {
    setSeen(beat.count);
    const now = beat.atMs;
    const alive =
      now === undefined ? ticks : ticks.filter((tick) => now - tick.bornAt < motion.traceCross);
    setTicks([
      ...alive.slice(-(MAX_TICKS - 1)),
      { id: beat.count, accent: beat.accent, figures: beat.figures ?? [], bornAt: now ?? 0 },
    ]);
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.trace, { height: layout.height }]}
    >
      <View
        style={[
          styles.baseline,
          {
            top: layout.baselineY - controls.pulseTraceStroke / 2,
            backgroundColor: colors.border,
          },
        ]}
      />
      {width > 0 &&
        ticks.map((tick) => <TraceMark key={tick.id} tick={tick} width={width} layout={layout} />)}
    </View>
  );
}

interface TraceMarkProps {
  tick: Tick;
  /** Ancho de la línea: lo que la marca recorre en `motion.traceCross`. */
  width: number;
  layout: TraceLayout;
}

/**
 * Una marca que cruza la línea a velocidad constante, con las figuras de su
 * golpe. `memo`: un golpe nuevo no vuelve a pintar las que ya van en camino.
 */
const TraceMark = memo(function TraceMark({ tick, width, layout }: TraceMarkProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const travel = width - controls.pulseTickWidth;

  useEffect(() => {
    // Lineal a propósito: la velocidad constante es lo que se está enseñando.
    progress.value = withTiming(1, { duration: motion.traceCross, easing: Easing.linear });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [FADE_FROM, 1], [1, 0], 'clamp'),
    transform: [{ translateX: progress.value * travel }],
  }));

  const height = tick.accent ? layout.accentTick : layout.tick;
  const space = controls.pulseTraceFigureSpace;
  // Píxeles que recorre la línea por cada ms.
  const speed = travel / motion.traceCross;

  return (
    <Animated.View style={[styles.mark, { height: layout.height }, style]}>
      <View
        style={[
          styles.tick,
          { height, top: layout.baselineY - height / 2, backgroundColor: colors.heart },
        ]}
      />
      {/* Después de la marca: la figura se dibuja por encima, con la cabeza sobre el trazo. */}
      {tick.figures.map(({ figure, offsetMs }) => {
        const glyph = glyphOf(figure);
        return (
          <View
            key={offsetMs}
            style={[
              styles.figure,
              {
                left: controls.pulseTickWidth / 2 - glyph.head.x * space - offsetMs * speed,
                top: layout.baselineY - glyph.head.y * space,
              },
            ]}
          >
            <FigureGlyph figure={figure} space={space} color={colors.textPrimary} />
          </View>
        );
      })}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  trace: {
    overflow: 'hidden',
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: controls.pulseTraceStroke,
    borderRadius: radii.pill,
  },
  mark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: controls.pulseTickWidth,
  },
  tick: {
    position: 'absolute',
    left: 0,
    width: controls.pulseTickWidth,
    borderRadius: radii.pill,
  },
  figure: {
    position: 'absolute',
  },
});
