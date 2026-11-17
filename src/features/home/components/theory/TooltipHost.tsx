import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

interface TooltipApi {
  /**
   * Abre la definición `text` bajo `anchor`. Tocar el mismo término otra vez
   * la cierra; tocar otro la cambia.
   */
  toggle: (key: string, anchor: View | null, text: string) => void;
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
  /** Centro del término y su borde inferior, relativos al host; null hasta medir. */
  anchor: { x: number; y: number } | null;
}

/**
 * Las definiciones de la teoría ("¿qué es el cifrado?"): un globo bajo el
 * término tocado, a todo el ancho del contenido y con la punta señalando el
 * término. Tocar fuera (o el propio globo) lo cierra.
 */
export function TooltipHost({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const host = useRef<View>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  // El toque que cierra un globo por "tocar fuera" llega antes que el del
  // término: si es el mismo término, ese toque solo debe cerrarlo.
  const closedByTouch = useRef<string | null>(null);

  const toggle = useCallback((key: string, anchor: View | null, text: string) => {
    const justClosed = closedByTouch.current === key;
    closedByTouch.current = null;
    if (justClosed) return;
    setTip((current) => (current?.key === key ? null : { key, text, anchor: null }));
    if (anchor === null || host.current === null) return;
    anchor.measureLayout(host.current, (x, y, width, height) =>
      setTip((current) =>
        current?.key === key
          ? { ...current, anchor: { x: x + width / 2, y: y + height } }
          : current,
      ),
    );
  }, []);

  const api = useMemo(() => ({ toggle }), [toggle]);
  const arrow = controls.tooltipArrowSize;

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
        {children}
        {tip !== null && (
          <Animated.View
            key={tip.key}
            entering={FadeIn.duration(motion.enter)}
            style={[
              styles.bubble,
              {
                top: (tip.anchor?.y ?? 0) + arrow / 2 + spacing.xs,
                opacity: tip.anchor === null ? 0 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.arrow,
                {
                  width: arrow,
                  height: arrow,
                  top: -arrow / 2,
                  left: Math.min(
                    Math.max((tip.anchor?.x ?? 0) - arrow / 2, radii.lg),
                    hostWidth - radii.lg - arrow,
                  ),
                  backgroundColor: colors.brand,
                },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${tip.text} Cerrar`}
              onPress={() => setTip(null)}
              style={[styles.card, { backgroundColor: colors.brand }]}
            >
              <Text style={[styles.text, { color: colors.textOnBrand }]}>{tip.text}</Text>
            </Pressable>
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
    transform: [{ rotate: '45deg' }],
  },
  card: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.subtitle,
    flexShrink: 0,
  },
});
