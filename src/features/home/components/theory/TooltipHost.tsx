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
  /** Ancho natural de la tarjeta (lo que pide su texto); null hasta medir. */
  width: number | null;
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
    setTip((current) => (current?.key === key ? null : { key, text, anchor: null, width: null }));
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
  // La tarjeta, centrada bajo el término pero dentro del contenido.
  const cardLeft =
    tip?.anchor && tip.width !== null
      ? Math.min(Math.max(tip.anchor.x - tip.width / 2, 0), hostWidth - tip.width)
      : 0;

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
        {tip !== null && tip.anchor !== null && (
          <Animated.View
            key={tip.key}
            entering={FadeIn.duration(motion.enter)}
            style={[styles.bubble, { top: tip.anchor.y + arrow / 2 + spacing.xs }]}
          >
            <View style={{ opacity: tip.width === null ? 0 : 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tip.text} Cerrar`}
                onPress={() => setTip(null)}
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  setTip((current) =>
                    current?.key === tip.key && current.width === null
                      ? { ...current, width }
                      : current,
                  );
                }}
                style={[
                  styles.card,
                  {
                    marginLeft: cardLeft,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.text, { color: colors.textPrimary }]}>{tip.text}</Text>
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
                      cardLeft + (tip.width ?? hostWidth) - radii.lg - arrow,
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
  text: {
    ...typography.tooltip,
    flexShrink: 0,
  },
});
