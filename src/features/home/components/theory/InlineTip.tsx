import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { controls, motion, spacing } from '@/shared/theme';

import { TipCard, TipText, useTooltip } from './TooltipHost';

interface InlineTipProps {
  /** La clave con la que se abre (`toggle(key, …, { inline: true })`). */
  tipKey: string;
  text: TipText;
}

/**
 * Un globo a todo el ancho DENTRO de la hoja, con la punta al centro: al
 * abrirse se despliega y empuja con suavidad todo lo de abajo, y la hoja baja
 * lo justo para leerlo entero; al cerrarse (tocar fuera, el globo o lo que lo
 * abrió) se recoge y todo vuelve a su sitio. Es para una respuesta que se
 * revela, no para la definición de una palabra (esas flotan).
 */
export function InlineTip({ tipKey, text }: InlineTipProps) {
  const tooltip = useTooltip();
  const open = tooltip.openKey === tipKey;
  const { reveal } = tooltip;
  // Sigue montado mientras se recoge, para que el cierre se vea.
  const [shown, setShown] = useState(open);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const card = useRef<View>(null);
  const progress = useSharedValue(0);

  if (open && !shown) setShown(true);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: motion.reveal,
      easing: Easing.out(Easing.cubic),
    });
    if (open) {
      // Un fotograma después, cuando la tarjeta ya se midió con su alto final.
      const frame = requestAnimationFrame(() => reveal(card.current));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setShown(false), motion.reveal);
    return () => clearTimeout(timer);
  }, [open, progress, reveal]);

  const style = useAnimatedStyle(() => ({
    height: progress.value * height,
    opacity: progress.value,
  }));

  if (!shown) return null;
  return (
    <Animated.View
      style={[styles.clip, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {/* Fuera del flujo: se mide con su alto entero aunque el contenedor esté a medio abrir. */}
      <View
        ref={card}
        collapsable={false}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={styles.card}
      >
        <TipCard
          text={text}
          wide
          left={0}
          arrowLeft={width / 2 - controls.tooltipArrowSize / 2}
          // Con un toque, el host ya lo cerró y esto no hace nada; con el ratón (web), lo cierra.
          onClose={() => tooltip.toggle(tipKey, null, text, undefined, { inline: true })}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Aire para la punta, que asoma por encima de la tarjeta.
    paddingTop: controls.tooltipArrowSize / 2 + spacing.sm,
  },
});
