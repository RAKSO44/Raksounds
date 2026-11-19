import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';

import { moduleById } from '@/domain/lessons';
import { Header } from '@/shared/design-system';
import { controls, motion, spacing, useTheme } from '@/shared/theme';

import { TheoryPager } from '../components/theory/TheoryPager';
import { THEORY_PAGES } from '../components/theory/theoryPages';
import { TooltipHost } from '../components/theory/TooltipHost';
import { useRevealScroll } from '../hooks/useRevealScroll';
import { useLessonProgressStore } from '../progressStore';

/**
 * La teoría de un módulo: hasta 3 hojas que se pasan con ← y →. Nada obliga a
 * hacer algo antes de seguir; el check de la última hoja da la teoría por
 * leída (el labio del módulo se vuelve dorado en el Home) y vuelve a la ruta.
 */
export function TheoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: string }>();
  const module = moduleById(params.module);
  const completeTheory = useLessonProgressStore((state) => state.completeTheory);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  // Un globo abierto bajo el borde de la pantalla se trae a la vista.
  const { scrollRef, onScrollLayout, onScroll, reveal } = useRevealScroll(CONTENT_PADDING_TOP);

  if (module === undefined) {
    // Enlace viejo o escrito a mano: solo queda volver a la ruta.
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Header title="Teoría" onBack={() => router.back()} />
      </View>
    );
  }

  const pages = THEORY_PAGES[module.id];
  const Page = pages[page];
  const go = (target: number) => {
    setDirection(target > page ? 'next' : 'previous');
    setPage(target);
  };
  const finish = () => {
    completeTheory(module.id);
    router.back();
  };
  // La hoja nueva entra por el lado hacia el que se avanza.
  const entering = (direction === 'next' ? FadeInRight : FadeInLeft).duration(motion.enter);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={module.title} onBack={() => router.back()} />

      {/* La `key` vuelve cada hoja a su inicio (scroll arriba, sin globos abiertos). */}
      <ScrollView
        key={page}
        ref={scrollRef}
        onLayout={onScrollLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <TooltipHost onReveal={reveal}>
          <Animated.View entering={entering}>
            <Page />
          </Animated.View>
        </TooltipHost>
      </ScrollView>

      <TheoryPager
        page={page}
        total={pages.length}
        onPrevious={() => go(page - 1)}
        onNext={() => go(page + 1)}
        onFinish={finish}
      />
    </View>
  );
}

const CONTENT_PADDING_TOP = spacing.lg;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: controls.pathMaxWidth,
    alignSelf: 'center',
    padding: spacing.md,
    paddingTop: CONTENT_PADDING_TOP,
    paddingBottom: spacing.xl,
  },
});
