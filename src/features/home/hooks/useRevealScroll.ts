import { RefObject, useCallback, useRef } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

export interface RevealScroll {
  scrollRef: RefObject<ScrollView | null>;
  onScrollLayout: (event: LayoutChangeEvent) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Desplaza lo justo para que se vea hasta `bottom` (medido desde el inicio
   * del contenido, sin su padding superior `offset`). Si ya se ve, no se mueve.
   */
  reveal: (bottom: number) => void;
}

/** Un `ScrollView` que puede traer a la vista algo que quedó por debajo (un globo). */
export function useRevealScroll(offset: number): RevealScroll {
  const ref = useRef<ScrollView>(null);
  const viewport = useRef(0);
  const scrollY = useRef(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    viewport.current = event.nativeEvent.layout.height;
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const reveal = useCallback(
    (bottom: number) => {
      const target = offset + bottom - viewport.current;
      if (target > scrollY.current) ref.current?.scrollTo({ y: target, animated: true });
    },
    [offset],
  );

  return { scrollRef: ref, onScrollLayout: onLayout, onScroll, reveal };
}
