import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticPressIn } from '@/shared/haptics';
import { controls, elevation, motion, radii, spacing, useTheme } from '@/shared/theme';

/**
 * - `idle`: cuadrado azul con el ícono del micrófono. Tocarlo empieza a escuchar.
 * - `starting`: ya se ensanchó; puntos mientras el micrófono se abre.
 * - `listening`: barras que se mueven con el volumen de la voz. Tocarlo corta.
 * - `disabled`: gris, plano y hundido, con puntos. Sin gesto.
 */
export type MicButtonState = 'idle' | 'starting' | 'listening' | 'disabled';

interface MicButtonProps {
  state: MicButtonState;
  /** Volumen de la voz en [0, 1]. Es un valor animado: moverlo no repinta React. */
  level: SharedValue<number>;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Mismo margen de arrastre que `PushButton`: más allá, el gesto se cancela. */
const PRESS_SLOP = 20;

/**
 * Cuánto de la altura disponible usa cada barra. Más altas al centro, como las
 * de Duolingo: la forma se lee como "voz" aunque el volumen sea uno solo.
 */
const BAR_PROFILE = [0.35, 0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55, 0.35] as const;

/** Qué pinta la cara en cada estado. */
type MicContent = 'icon' | 'dots' | 'bars';

function contentOf(state: MicButtonState): MicContent {
  if (state === 'idle') return 'icon';
  if (state === 'listening') return 'bars';
  return 'dots';
}

function widthOf(state: MicButtonState): number {
  return state === 'idle' ? controls.micButtonSize : controls.micButtonWideWidth;
}

const CONTENT_FADE = { duration: motion.micContent, easing: Easing.out(Easing.quad) };

/**
 * Botón de micrófono estilo Duolingo.
 *
 * Tiene el mismo relieve que `PushButton` (cara sobre un labio más oscuro, snap
 * instantáneo al presionar y un solo golpe háptico) pero su contenido cambia de
 * estado en estado, y al pasar de reposo a escuchar se ENSANCHA de cuadrado a
 * píldora. Es un cambio de ancho, corto y con curva de salida: no crece en
 * escala ni rebota.
 *
 * El contenido nunca cambia a la vez que el ancho: primero se desvanece, luego
 * el botón se ensancha (o se encoge) y al final entra el contenido nuevo.
 *
 * Deshabilitado se ve como en Duolingo tras hablar: gris, sin labio y hundido
 * (la cara ocupa el sitio del labio), con los puntos en gris.
 */
export function MicButton({ state, level, onPress, accessibilityLabel }: MicButtonProps) {
  const { colors } = useTheme();
  const disabled = state === 'disabled';
  const interactive = state === 'idle' || state === 'listening';

  const pressOffset = useSharedValue(disabled ? elevation.buttonLip : 0);
  const width = useSharedValue<number>(widthOf(state));
  const iconOpacity = useSharedValue(contentOf(state) === 'icon' ? 1 : 0);
  const dotsOpacity = useSharedValue(contentOf(state) === 'dots' ? 1 : 0);
  const barsOpacity = useSharedValue(contentOf(state) === 'bars' ? 1 : 0);

  const previousState = useRef(state);
  // Momento (ms, reloj de pared) en que termina el último ensanchado. Un estado
  // que llega a mitad de él (el micro abre antes de que se vean los puntos)
  // debe esperar igual: si no, su contenido aparecería en un botón aún estrecho.
  const resizeEndsAt = useRef(0);

  useEffect(() => {
    const from = previousState.current;
    previousState.current = state;
    // Deshabilitado = hundido: snap, igual que una pulsación.
    pressOffset.value = disabled ? elevation.buttonLip : 0;
    if (from === state) return;

    // Cambiar de ancho con contenido dentro hace que los puntos se salgan del
    // cuadrado (9 puntos no caben en 88 px). Así que va en tres tiempos, como en
    // Duolingo: el contenido se desvanece, el botón cambia de ancho vacío, y el
    // contenido nuevo aparece cuando ya tiene sitio.
    const now = Date.now();
    if (widthOf(from) !== widthOf(state)) {
      width.value = withDelay(
        motion.micContent,
        withTiming(widthOf(state), {
          duration: motion.micResize,
          easing: Easing.out(Easing.cubic),
        }),
      );
      resizeEndsAt.current = now + motion.micContent + motion.micResize;
    }
    const fadeInDelay = Math.max(0, resizeEndsAt.current - now);

    const next = contentOf(state);
    const layers: [MicContent, typeof iconOpacity][] = [
      ['icon', iconOpacity],
      ['dots', dotsOpacity],
      ['bars', barsOpacity],
    ];
    for (const [content, opacity] of layers) {
      opacity.value =
        content === next
          ? withDelay(fadeInDelay, withTiming(1, CONTENT_FADE))
          : withTiming(0, CONTENT_FADE);
    }
  }, [state, disabled, width, pressOffset, iconOpacity, dotsOpacity, barsOpacity]);

  const handlePressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    pressOffset.value = elevation.buttonLip;
    hapticPressIn();
  }, [pressOffset]);

  const handlePressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- ídem
    pressOffset.value = disabled ? elevation.buttonLip : 0;
  }, [pressOffset, disabled]);

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(PRESS_SLOP)
        .enabled(interactive)
        .runOnJS(true)
        .onStart(handlePressIn)
        .onEnd((_event, success) => {
          if (success) onPress();
        })
        .onFinalize(handlePressOut),
    [interactive, handlePressIn, handlePressOut, onPress],
  );

  const containerStyle = useAnimatedStyle(() => ({ width: width.value }));
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pressOffset.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: iconOpacity.value }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));
  const barsStyle = useAnimatedStyle(() => ({ opacity: barsOpacity.value }));

  const faceColor = disabled ? colors.disabledSurface : colors.secondary;
  const lipColor = disabled ? colors.disabledSurface : colors.secondaryShadow;
  const contentColor = disabled ? colors.disabledText : colors.textOnBrand;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: !interactive, busy: state === 'starting' }}
        accessibilityLabel={accessibilityLabel ?? 'Micrófono'}
        onAccessibilityTap={() => {
          if (interactive) onPress();
        }}
        style={[styles.container, containerStyle]}
      >
        <View style={[styles.lip, { backgroundColor: lipColor }]} />
        <Animated.View style={[styles.face, { backgroundColor: faceColor }, faceStyle]}>
          {/* Las tres capas están siempre montadas, una encima de otra, y solo
              cambia su opacidad: así una puede desvanecerse mientras otra entra. */}
          <Animated.View style={[styles.layer, iconStyle]}>
            <MaterialCommunityIcons name="microphone" size={40} color={contentColor} />
          </Animated.View>
          <Animated.View style={[styles.layer, dotsStyle]}>
            <Dots color={contentColor} />
          </Animated.View>
          <Animated.View style={[styles.layer, barsStyle]}>
            <Bars color={contentColor} level={level} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function Dots({ color }: { color: string }) {
  return (
    <View style={styles.row}>
      {BAR_PROFILE.map((_, index) => (
        <View key={index} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function Bars({ color, level }: { color: string; level: SharedValue<number> }) {
  return (
    <View style={styles.row}>
      {BAR_PROFILE.map((weight, index) => (
        <Bar key={index} index={index} weight={weight} color={color} level={level} />
      ))}
    </View>
  );
}

interface BarProps {
  index: number;
  weight: number;
  color: string;
  level: SharedValue<number>;
}

function Bar({ index, weight, color, level }: BarProps) {
  const style = useAnimatedStyle(() => {
    // Cada barra responde un poco distinto al mismo volumen (una ondulación
    // que depende del propio volumen): sin esto las nueve subirían y bajarían
    // en bloque y se leería como un ecualizador, no como una voz.
    const ripple = 0.8 + 0.2 * Math.sin(level.value * 12 + index * 1.7);
    const span = controls.micBarMaxHeight - controls.micBarMinHeight;
    return { height: controls.micBarMinHeight + span * Math.min(1, level.value * weight * ripple) };
  });

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
    height: controls.micButtonSize + elevation.buttonLip,
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
    height: controls.micButtonSize,
    zIndex: 1,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: controls.micDotSize,
    height: controls.micDotSize,
    borderRadius: radii.pill,
  },
  bar: {
    width: controls.micBarWidth,
    borderRadius: radii.pill,
  },
});
