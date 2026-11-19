import { useEffect, useEffectEvent, useId, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { beatIntervalMs, metronomeWeightPosition } from '@/domain/lessons';
import { PRESS_SLOP } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, motion, typography, useTheme } from '@/shared/theme';

import { HeardBeat } from '../hooks/usePulseLoop';

/**
 * El dibujo, en unidades de un lienzo de 100 de ancho (se escala entero al
 * tamaño pedido). Son las proporciones del objeto, no espaciados de la UI.
 */
const VIEW = { width: 100, height: 124 } as const;
/** Cuerpo: pirámide redondeada; el labio es la misma forma, más abajo. */
const BODY = { top: 2, bottom: 116, topLeft: 33, topRight: 67, bottomLeft: 4, bottomRight: 96 };
const BODY_RADIUS = 8;
const LIP_DROP = 6;
/** Escala crema donde oscila el brazo. */
const PANEL = { top: 12, bottom: 74, topLeft: 41, topRight: 59, bottomLeft: 33, bottomRight: 67 };
const PANEL_RADIUS = 4;
/** Eje del brazo, al pie de la escala. */
const PIVOT = { x: 50, y: 69 };
const ARM_TOP = 14;
const ARM_BOX = 14;
const ROD_WIDTH = 3;
const PIVOT_RADIUS = 2.8;
/** Pesa: tamaño y altura de su centro, de lo más lento a lo más rápido. */
const WEIGHT = { width: 11, height: 8, slowY: 23, fastY: 52, inset: 1.5 };
/**
 * Placa del BPM: de alto fijo, con aire por arriba (el eje) y por abajo (el
 * pie). El texto se centra dentro de ella, no al revés: si la placa midiera
 * lo que su texto, en Android crecería con el relleno de la fuente y tocaría
 * el eje.
 */
const PLATE = { x: 33, y: 86, width: 34, height: 20, radius: 5 };
/**
 * Apagado no es "otro objeto": la madera se atenúa bajo un velo neutro. El
 * cambio se nota sin llamar la atención.
 */
const OFF_VEIL = 0.7;
/** La línea central es una guía, no un dibujo: casi transparente. */
const GUIDE_OPACITY = 0.28;

interface Corners {
  top: number;
  bottom: number;
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/** Trapecio con las cuatro esquinas redondeadas (curvas que siguen cada lado). */
function trapezoidPath(c: Corners, radius: number, dy = 0): string {
  const toward = (ax: number, ay: number, bx: number, by: number) => {
    const length = Math.hypot(bx - ax, by - ay);
    return `${ax + ((bx - ax) * radius) / length},${ay + dy + ((by - ay) * radius) / length}`;
  };
  const { top, bottom, topLeft, topRight, bottomLeft, bottomRight } = c;
  return [
    `M${topLeft + radius},${top + dy}`,
    `L${topRight - radius},${top + dy}`,
    `Q${topRight},${top + dy} ${toward(topRight, top, bottomRight, bottom)}`,
    `L${toward(bottomRight, bottom, topRight, top)}`,
    `Q${bottomRight},${bottom + dy} ${bottomRight - radius},${bottom + dy}`,
    `L${bottomLeft + radius},${bottom + dy}`,
    `Q${bottomLeft},${bottom + dy} ${toward(bottomLeft, bottom, topLeft, top)}`,
    `L${toward(topLeft, top, bottomLeft, bottom)}`,
    `Q${topLeft},${top + dy} ${topLeft + radius},${top + dy}`,
    'Z',
  ].join(' ');
}

const BODY_PATH = trapezoidPath(BODY, BODY_RADIUS);
const LIP_PATH = trapezoidPath(BODY, BODY_RADIUS, LIP_DROP);
const PANEL_PATH = trapezoidPath(PANEL, PANEL_RADIUS);
const WEIGHT_PATH = trapezoidPath(
  {
    top: 0,
    bottom: WEIGHT.height,
    topLeft: WEIGHT.inset,
    topRight: WEIGHT.width - WEIGHT.inset,
    bottomLeft: 0,
    bottomRight: WEIGHT.width,
  },
  WEIGHT.inset,
);

interface MetronomeProps {
  /** Suena: madera y vaivén. Apagado: neutro y quieto. */
  running: boolean;
  /** Tempo al que oscila el brazo mientras suena. */
  bpm: number;
  beat: HeardBeat;
  /** Lo que dice la placa: el BPM ("90") o "?" mientras no se puede ver. */
  plate: string;
  /**
   * Dónde se coloca la pesa (su BPM). Sin él queda a media altura: mientras
   * el tempo es la pregunta, la pesa no debe delatarlo.
   */
  weightBpm?: number;
  size?: 'regular' | 'small';
  /** Sin él, el metrónomo no es un botón (suena por su cuenta). */
  onToggle?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

/**
 * Metrónomo de péndulo dibujado en la app (como el teclado del piano): una
 * pirámide de nogal con labio 3D, la escala crema con una línea central muy
 * tenue (el centro del vaivén), el brazo de acero con su pesa de latón y una
 * placa con el BPM.
 *
 * Como en uno real, la pesa sube para los tempos lentos y baja para los
 * rápidos, y el brazo llega a un extremo con cada golpe. Encender y apagar
 * es un fundido entre la madera y el gris neutro de la app; al cambiar de
 * tempo el brazo sigue su vaivén sin saltos, con la nueva duración.
 */
export function Metronome({
  running,
  bpm,
  beat,
  plate,
  weightBpm,
  size = 'regular',
  onToggle,
  disabled = false,
  accessibilityLabel,
}: MetronomeProps) {
  const { colors } = useTheme();
  const width = controls.metronomeWidth * (size === 'small' ? controls.metronomeSmall : 1);
  const k = width / VIEW.width;
  // Ids de degradado propios: en web todos los SVG comparten documento.
  const gradient = `metronome${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const lit = useSharedValue(running ? 1 : 0);
  const swing = useSharedValue(0);
  const weight = useSharedValue(weightPosition(weightBpm));
  const pressed = useSharedValue(0);
  // Lado al que va el brazo en el próximo golpe: alterna siempre, también al
  // cambiar de tempo, para que el vaivén nunca se quede quieto un golpe.
  const side = useRef(1);

  useEffect(() => {
    lit.value = withTiming(running ? 1 : 0, {
      duration: motion.metronomeFade,
      easing: Easing.inOut(Easing.quad),
    });
    if (running) return;

    swing.value = withTiming(0, {
      duration: motion.metronomeFade,
      easing: Easing.inOut(Easing.sin),
    });
  }, [running, lit, swing]);

  useEffect(() => {
    weight.value = withTiming(weightPosition(weightBpm), {
      duration: motion.metronomeWeight,
      easing: Easing.inOut(Easing.quad),
    });
  }, [weightBpm, weight]);

  // Cada golpe lanza el brazo al lado contrario: llega justo con el siguiente.
  const onBeat = useEffectEvent(() => {
    if (!running || bpm <= 0) return;
    const target = side.current * controls.metronomeSwing;
    side.current = -side.current;
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    swing.value = withTiming(target, {
      duration: beatIntervalMs(bpm),
      easing: Easing.inOut(Easing.sin),
    });
  });
  useEffect(() => {
    if (beat.count > 0) onBeat();
  }, [beat.count]);

  const plateColors = { off: colors.textSecondary, on: colors.metronomeWoodDark };
  const neutralStyle = useAnimatedStyle(() => ({ opacity: (1 - lit.value) * OFF_VEIL }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * LIP_DROP * k }],
  }));
  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));
  const weightStyle = useAnimatedStyle(() => ({
    top:
      (WEIGHT.slowY + weight.value * (WEIGHT.fastY - WEIGHT.slowY) - WEIGHT.height / 2 - ARM_TOP) *
      k,
  }));
  const plateTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(lit.value, [0, 1], [plateColors.off, plateColors.on]),
  }));

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(PRESS_SLOP)
        .enabled(onToggle !== undefined && !disabled)
        .runOnJS(true)
        .onStart(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 1;
          hapticPressIn();
        })
        .onEnd((_event, success) => {
          if (success) onToggle?.();
        })
        .onFinalize(() => {
          // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
          pressed.value = 0;
        }),
    [onToggle, disabled, pressed],
  );

  const height = VIEW.height * k;
  const layer = { width, height };
  const viewBox = `0 0 ${VIEW.width} ${VIEW.height}`;
  const armHeight = PIVOT.y - ARM_TOP + PIVOT_RADIUS;

  const body = (
    <View
      accessible
      accessibilityRole={onToggle ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onToggle ? { checked: running, disabled } : undefined}
      onAccessibilityTap={onToggle && !disabled ? onToggle : undefined}
      style={layer}
    >
      {/* Labio: madera oscura encendido; la sombra neutra se funde encima al apagarlo. */}
      <Svg style={styles.layer} width={width} height={height} viewBox={viewBox}>
        <Path d={LIP_PATH} fill={colors.metronomeLip} />
      </Svg>
      <Animated.View style={[styles.layer, layer, neutralStyle]}>
        <Svg width={width} height={height} viewBox={viewBox}>
          <Path d={LIP_PATH} fill={colors.surfaceShadow} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, layer, faceStyle]}>
        <Svg width={width} height={height} viewBox={viewBox}>
          <Defs>
            <LinearGradient id={`${gradient}wood`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.metronomeWoodLight} />
              <Stop offset="0.55" stopColor={colors.metronomeWood} />
              <Stop offset="1" stopColor={colors.metronomeWoodDark} />
            </LinearGradient>
            <LinearGradient id={`${gradient}scale`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.metronomeScale} />
              <Stop offset="1" stopColor={colors.metronomeScaleShade} />
            </LinearGradient>
          </Defs>
          <Path d={BODY_PATH} fill={`url(#${gradient}wood)`} />
          <Path d={PANEL_PATH} fill={`url(#${gradient}scale)`} />
          <CenterLine color={colors.metronomeWoodDark} />
          <Plate color={colors.metronomeScale} />
        </Svg>

        <Animated.View style={[styles.layer, layer, neutralStyle]}>
          <Svg width={width} height={height} viewBox={viewBox}>
            <Path d={BODY_PATH} fill={colors.surface} />
            <Path d={PANEL_PATH} fill={colors.progressTrack} />
            <CenterLine color={colors.textSecondary} />
            <Plate color={colors.progressTrack} />
          </Svg>
        </Animated.View>

        <View
          pointerEvents="none"
          style={[
            styles.layer,
            styles.plateText,
            {
              left: PLATE.x * k,
              top: PLATE.y * k,
              width: PLATE.width * k,
              height: PLATE.height * k,
            },
          ]}
        >
          <Animated.Text
            style={[size === 'small' ? styles.plateSmall : styles.plateLabel, plateTextStyle]}
          >
            {plate}
          </Animated.Text>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.layer,
            {
              left: (PIVOT.x - ARM_BOX / 2) * k,
              top: ARM_TOP * k,
              width: ARM_BOX * k,
              height: armHeight * k,
              // Gira desde el eje, al pie del brazo, como un péndulo invertido.
              transformOrigin: [(ARM_BOX / 2) * k, (PIVOT.y - ARM_TOP) * k, 0],
            },
            armStyle,
          ]}
        >
          <Arm k={k} />
          <Animated.View
            style={[styles.layer, { left: ((ARM_BOX - WEIGHT.width) / 2) * k }, weightStyle]}
          >
            <Weight k={k} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (onToggle === undefined) return body;
  return <GestureDetector gesture={gesture}>{body}</GestureDetector>;
}

/** La placa del BPM (el texto va encima, centrado). */
function Plate({ color }: { color: string }) {
  return (
    <Rect
      x={PLATE.x}
      y={PLATE.y}
      width={PLATE.width}
      height={PLATE.height}
      rx={PLATE.radius}
      fill={color}
    />
  );
}

function weightPosition(bpm: number | undefined): number {
  return bpm === undefined ? 0.5 : metronomeWeightPosition(bpm);
}

/** La guía: una línea vertical muy tenue en el centro de la escala. */
function CenterLine({ color }: { color: string }) {
  return (
    <Line
      x1={PIVOT.x}
      y1={PANEL.top + PANEL_RADIUS}
      x2={PIVOT.x}
      y2={PANEL.bottom - PANEL_RADIUS}
      stroke={color}
      strokeOpacity={GUIDE_OPACITY}
      strokeWidth={1}
      strokeLinecap="round"
    />
  );
}

/**
 * Varilla y eje en colores planos, sin bordes ni brillos: el cuerpo ya da la
 * sensación de objeto; las piezas pequeñas con detalle se ven recargadas.
 */
function Arm({ k }: { k: number }) {
  const { colors } = useTheme();
  const length = PIVOT.y - ARM_TOP;
  const height = length + PIVOT_RADIUS;
  return (
    <Svg width={ARM_BOX * k} height={height * k} viewBox={`0 0 ${ARM_BOX} ${height}`}>
      <Rect
        x={(ARM_BOX - ROD_WIDTH) / 2}
        y={0}
        width={ROD_WIDTH}
        height={length}
        rx={ROD_WIDTH / 2}
        fill={colors.metronomeSteelDark}
      />
      <Circle cx={ARM_BOX / 2} cy={length} r={PIVOT_RADIUS} fill={colors.metronomeBrass} />
    </Svg>
  );
}

/** La pesa deslizable, de latón plano. */
function Weight({ k }: { k: number }) {
  const { colors } = useTheme();
  return (
    <Svg
      width={WEIGHT.width * k}
      height={WEIGHT.height * k}
      viewBox={`0 0 ${WEIGHT.width} ${WEIGHT.height}`}
    >
      <Path d={WEIGHT_PATH} fill={colors.metronomeBrass} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  plateText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateLabel: {
    ...typography.chip,
    flexShrink: 0,
    // Sin el relleno de fuente de Android, el número queda centrado de verdad.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  plateSmall: {
    ...typography.caption,
    flexShrink: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
