import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

/** Ícono con el que puede cerrar una definición ("¡Esa referencia es el pulso! ♥"). */
export type TipIcon = 'heart';

interface TooltipApi {
  /**
   * Abre la definición `text` bajo `anchor`. Tocar el mismo término otra vez
   * la cierra; tocar otro la cambia. `wide`: ocupa todo el ancho del
   * contenido (una respuesta que se revela, no la definición de una palabra).
   */
  toggle: (
    key: string,
    anchor: View | null,
    text: string,
    icon?: TipIcon,
    options?: { wide?: boolean },
  ) => void;
  /**
   * Trae `target` a la vista con un scroll suave, solo si quedó (en parte)
   * por debajo de lo visible; si ya se ve, no se mueve nada.
   */
  reveal: (target: View | null) => void;
}

const TooltipContext = createContext<TooltipApi | null>(null);

export function useTooltip(): TooltipApi {
  const api = useContext(TooltipContext);
  if (api === null) throw new Error('useTooltip necesita un <TooltipHost> por encima');
  return api;
}

interface Tip {
  key: string;
  text: string;
  icon?: TipIcon;
  wide: boolean;
  /** Centro del término y su borde inferior, relativos al host; null hasta medir. */
  anchor: { x: number; y: number } | null;
  /** Tamaño natural de la tarjeta (lo que pide su texto); null hasta medir. */
  size: { width: number; height: number } | null;
}

interface TooltipHostProps {
  children: ReactNode;
  /**
   * Avisa dónde termina el globo abierto (en coordenadas del host), para que
   * quien tiene el scroll lo traiga a la vista si quedó por debajo.
   */
  onReveal?: (bottom: number) => void;
}

/**
 * Las definiciones de la teoría ("¿qué es el cifrado?"): un globo bajo el
 * término tocado, del ancho que pida su frase (nunca más que el contenido),
 * centrado bajo el término sin salirse de los bordes y con la punta
 * señalándolo. Como los de Duolingo: sin color (la superficie con su borde) y
 * con una frase corta. Tocar fuera (o el propio globo) lo cierra.
 *
 * El globo no se pinta hasta medir el término. Luego se mide la tarjeta para
 * centrarla: mientras tanto se oculta una capa INTERIOR, nunca la que lleva
 * la animación de entrada (Reanimated pisaría su `opacity`).
 */
export function TooltipHost({ children, onReveal }: TooltipHostProps) {
  const { colors } = useTheme();
  const host = useRef<View>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  // El toque que cierra un globo por "tocar fuera" llega antes que el del
  // término: si es el mismo término, ese toque solo debe cerrarlo.
  const closedByTouch = useRef<string | null>(null);

  const toggle = useCallback(
    (
      key: string,
      anchor: View | null,
      text: string,
      icon?: TipIcon,
      options: { wide?: boolean } = {},
    ) => {
      const justClosed = closedByTouch.current === key;
      closedByTouch.current = null;
      if (justClosed) return;
      setTip((current) =>
        current?.key === key
          ? null
          : { key, text, icon, wide: options.wide ?? false, anchor: null, size: null },
      );
      if (anchor === null || host.current === null) return;
      anchor.measureLayout(host.current, (x, y, width, height) =>
        setTip((current) =>
          current?.key === key
            ? { ...current, anchor: { x: x + width / 2, y: y + height } }
            : current,
        ),
      );
    },
    [],
  );

  const reveal = useCallback(
    (target: View | null) => {
      if (target === null || host.current === null || onReveal === undefined) return;
      target.measureLayout(host.current, (_x, y, _width, height) =>
        onReveal(y + height + spacing.md),
      );
    },
    [onReveal],
  );

  const api = useMemo(() => ({ toggle, reveal }), [toggle, reveal]);
  const arrow = controls.tooltipArrowSize;
  // La tarjeta, centrada bajo el término pero dentro del contenido.
  const cardLeft =
    tip?.anchor && tip.size !== null
      ? Math.min(Math.max(tip.anchor.x - tip.size.width / 2, 0), hostWidth - tip.size.width)
      : 0;
  const bubbleTop = tip?.anchor ? tip.anchor.y + arrow / 2 + spacing.xs : 0;
  // Dónde acaba el globo, con un margen: null mientras no esté medido.
  const bubbleBottom =
    tip?.anchor && tip.size !== null ? bubbleTop + tip.size.height + spacing.md : null;
  // Un globo bajo el último término se saldría del contenido y el scroll no
  // llegaría a él: se reserva debajo el alto que le falta.
  // Mientras se mide un globo nuevo, el hueco se queda como está (undefined).
  const overflow =
    tip === null
      ? 0
      : bubbleBottom === null
        ? undefined
        : Math.max(0, bubbleBottom - contentHeight);
  const reserved = useSharedValue(0);
  const reservedStyle = useAnimatedStyle(() => ({ height: reserved.value }));

  useEffect(() => {
    if (overflow === undefined) return;
    // Crecer es inmediato (el scroll tiene que poder bajar ya hasta el globo);
    // encoger se anima, y la pantalla vuelve deslizándose en vez de saltar.
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    reserved.value =
      overflow >= reserved.value
        ? overflow
        : withTiming(overflow, { duration: motion.sheet, easing: Easing.out(Easing.cubic) });
  }, [overflow, reserved]);

  useEffect(() => {
    if (bubbleBottom === null || onReveal === undefined) return;
    // Un fotograma después, cuando el hueco reservado ya alargó el scroll.
    const frame = requestAnimationFrame(() => onReveal(bubbleBottom));
    return () => cancelAnimationFrame(frame);
  }, [bubbleBottom, onReveal]);

  return (
    <TooltipContext.Provider value={api}>
      <View
        ref={host}
        onLayout={(event) => setHostWidth(event.nativeEvent.layout.width)}
        onTouchStart={() => {
          closedByTouch.current = tip?.key ?? null;
          if (tip !== null) setTip(null);
        }}
      >
        <View onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
          {children}
        </View>
        <Animated.View style={reservedStyle} />
        {tip !== null && tip.anchor !== null && (
          <Animated.View
            key={tip.key}
            entering={FadeIn.duration(motion.enter)}
            exiting={FadeOut.duration(motion.exit)}
            style={[styles.bubble, { top: bubbleTop }]}
          >
            <View style={{ opacity: tip.size === null ? 0 : 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tip.text} Cerrar`}
                onPress={() => setTip(null)}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setTip((current) =>
                    current?.key === tip.key && current.size === null
                      ? { ...current, size: { width, height } }
                      : current,
                  );
                }}
                style={[
                  styles.card,
                  tip.wide && styles.wide,
                  {
                    marginLeft: cardLeft,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.text, { color: colors.textPrimary }]}>
                  {tip.text}
                  {tip.icon === 'heart' && (
                    <>
                      {' '}
                      <MaterialCommunityIcons
                        name="heart"
                        size={typography.tooltip.fontSize}
                        color={colors.heart}
                      />
                    </>
                  )}
                </Text>
              </Pressable>
              {/* La punta va DESPUÉS de la tarjeta: su mitad de abajo tapa el
                borde de la tarjeta y la punta queda unida a ella. */}
              <View
                pointerEvents="none"
                style={[
                  styles.arrow,
                  {
                    width: arrow,
                    height: arrow,
                    top: -arrow / 2,
                    left: Math.min(
                      Math.max(tip.anchor.x - arrow / 2, cardLeft + radii.lg),
                      cardLeft + (tip.size?.width ?? hostWidth) - radii.lg - arrow,
                    ),
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </TooltipContext.Provider>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  arrow: {
    position: 'absolute',
    // Solo los dos lados que asoman por encima de la tarjeta llevan borde.
    borderTopWidth: controls.tooltipBorder,
    borderLeftWidth: controls.tooltipBorder,
    transform: [{ rotate: '45deg' }],
  },
  card: {
    // Del ancho de su frase, no del contenido entero.
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: controls.tooltipBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  wide: {
    alignSelf: 'stretch',
  },
  text: {
    ...typography.tooltip,
    flexShrink: 0,
  },
});
