import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { spacing } from '@/shared/theme';

/**
 * Cuánto tiene que haber pasado una etapa bajo la tarjeta fija para contar
 * como la actual: su divisor ya está tapado, no solo rozando el borde.
 */
const TRIGGER = spacing.lg;

/** La etapa en curso: la última cuyo inicio ya quedó a la altura de `line`. */
function stageAt(tops: readonly number[], line: number): number {
  'worklet';
  let index = 0;
  for (let k = 1; k < tops.length; k += 1) {
    if (tops[k] <= line) index = k;
  }
  return index;
}

/**
 * El scroll de la ruta del Home, por etapas: sabe qué etapa está bajo la
 * tarjeta fija (que tapa `topInset` px del ScrollView) y lleva a cualquiera de
 * ellas. Cada etapa reporta dónde empieza con `onSectionLayout(i)`.
 */
export function useStageScroll(stageCount: number, topInset: number) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  // Hasta medirse, las etapas siguientes están "infinitamente" abajo: si no,
  // la tarjeta mostraría la última etapa en el primer fotograma.
  const tops = useSharedValue<number[]>(
    Array.from({ length: stageCount }, (_, index) => (index === 0 ? 0 : Number.MAX_SAFE_INTEGER)),
  );
  const inset = useSharedValue(topInset);
  // Copia en JS para que `scrollToStage` sea estable: el Home lo usa al
  // recuperar el foco y no debe re-ejecutar ese efecto si la tarjeta cambia de alto.
  const insetRef = useRef(topInset);
  useEffect(() => {
    inset.value = topInset;
    insetRef.current = topInset;
  }, [inset, topInset]);
  const [current, setCurrent] = useState(0);
  // Todas las etapas medidas al menos una vez: hasta entonces no hay adónde
  // desplazarse. Es un estado que cambia UNA vez, no con cada medición.
  const [measured, setMeasured] = useState(false);
  // Publicación de `tops` pendiente para el próximo fotograma (ver abajo).
  const publishFrame = useRef<number | null>(null);
  // Copia en JS de `tops`: la fuente de verdad al medir. Ver `onSectionLayout`.
  const sectionTops = useRef<number[]>(
    Array.from({ length: stageCount }, (_, index) => (index === 0 ? 0 : Number.MAX_SAFE_INTEGER)),
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => stageAt(tops.value, scrollY.value + inset.value + TRIGGER),
    (index, previous) => {
      if (index !== previous) runOnJS(setCurrent)(index);
    },
  );

  const onSectionLayout = useCallback(
    (index: number) => (event: LayoutChangeEvent) => {
      sectionTops.current[index] = event.nativeEvent.layout.y;
      // Mientras un módulo se abre o se cierra, TODAS las etapas de debajo se
      // mueven y mandan una medición por fotograma: se agrupan y se publica
      // una sola vez por fotograma, no una por etapa.
      //
      // Se publica la copia de JS entera, nunca `[...tops.value]`: escribir un
      // shared value desde JS se aplica en el hilo de UI MÁS TARDE, así que las
      // etapas que se miden en la misma pasada leían el array viejo y cada
      // escritura pisaba la anterior (la tarjeta saltaba de la etapa 1 a la 3).
      if (publishFrame.current === null) {
        publishFrame.current = requestAnimationFrame(() => {
          publishFrame.current = null;
          tops.value = [...sectionTops.current];
        });
      }
      if (index === stageCount - 1) setMeasured(true);
    },
    [tops, stageCount],
  );
  useEffect(
    () => () => {
      if (publishFrame.current !== null) cancelAnimationFrame(publishFrame.current);
    },
    [],
  );

  /**
   * Deja la etapa justo bajo la tarjeta, sin animar: el salto ocurre mientras
   * la pantalla de etapas se cierra, que al irse ya descubre la ruta en su sitio.
   */
  const scrollToStage = useCallback(
    (index: number) => {
      const target = Math.max(0, (sectionTops.current[index] ?? 0) - insetRef.current);
      scrollRef.current?.scrollTo({ y: target, animated: false });
    },
    [scrollRef],
  );

  return { scrollRef, onScroll, onSectionLayout, scrollToStage, current, measured };
}
