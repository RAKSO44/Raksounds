import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';

import { ModuleId, PathModule, progressOf, STAGES } from '@/domain/lessons';
import { ConfirmDialog, Header } from '@/shared/design-system';
import { useHardwareBack, useSettingsAction } from '@/shared/navigation';
import { controls, spacing, useTheme } from '@/shared/theme';

import { ModuleRow } from '../components/ModuleRow';
import { StageBanner } from '../components/StageBanner';
import { StageDivider } from '../components/StageDivider';
import { useStageScroll } from '../hooks/useStageScroll';
import { useLessonProgressStore } from '../progressStore';
import { useStageSelectionStore } from '../stageSelection';
import { stageTone } from '../stageTone';

/**
 * El Home ("Inicio"): las etapas del roadmap, una tras otra, separadas por una
 * línea con su título. Arriba, una única tarjeta fija dice en qué etapa se
 * está y, al tocarla, abre la pantalla con todas para saltar a cualquiera.
 *
 * Al abrir la app, la ruta arranca en la última etapa con la que se
 * interactuó (guardada en el dispositivo).
 *
 * Tocar un módulo lo abre en tarjeta (y cierra el que estuviera abierto);
 * tocarlo de nuevo lo cierra. Nada está bloqueado: un módulo sin lección
 * todavía solo avisa de que llega pronto.
 */
export function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const settings = useSettingsAction();
  const progress = useLessonProgressStore((state) => state.modules);
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [soon, setSoon] = useState<PathModule | null>(null);
  const [visible, setVisible] = useState(true);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const { scrollRef, onScroll, onSectionLayout, scrollToStage, current, lastHeight } =
    useStageScroll(STAGES.length, bannerHeight);

  // Al salir (a una lección, a otra pestaña) se cierra lo abierto; y mientras
  // no se ve, los nodos no animan sus cambios de estado. Al volver de la
  // pantalla de etapas, se salta a la elegida.
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      const { pending, clear } = useStageSelectionStore.getState();
      if (pending !== null) {
        clear();
        scrollToStage(pending);
      }
      return () => {
        setVisible(false);
        setOpenNumber(null);
      };
    }, [scrollToStage]),
  );

  // Una sola vez, cuando ya están medidas la tarjeta, la ventana y las etapas
  // (antes, el desplazamiento no tendría adónde llegar): se coloca la ruta en
  // la última etapa guardada.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || bannerHeight === 0 || viewportHeight === 0 || lastHeight === 0) return;
    restored.current = true;
    const { last } = useStageSelectionStore.getState();
    if (last <= 0 || last >= STAGES.length) return;
    // Un fotograma después, cuando el relleno final ya está aplicado.
    requestAnimationFrame(() => scrollToStage(last));
  }, [bannerHeight, viewportHeight, lastHeight, scrollToStage]);

  useHardwareBack(
    useCallback(() => {
      if (openNumber === null) return false;
      setOpenNumber(null);
      return true;
    }, [openNumber]),
  );

  const toggle = (module: PathModule, stageIndex: number) => {
    useStageSelectionStore.getState().touch(stageIndex);
    if (module.lessonId === null) {
      setSoon(module);
      return;
    }
    setOpenNumber((now) => (now === module.number ? null : module.number));
  };

  const openLesson = (pathname: '/lesson/theory' | '/lesson/practice', id: ModuleId) =>
    router.push({ pathname, params: { module: id } });

  // Espacio al final para que la última etapa pueda subir hasta la tarjeta:
  // si no, su divisor nunca llegaría arriba y la tarjeta no cambiaría.
  const tail = Math.max(spacing.xl, viewportHeight - bannerHeight - lastHeight);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Inicio" action={settings} />
      <View
        style={styles.body}
        onLayout={(event: LayoutChangeEvent) => setViewportHeight(event.nativeEvent.layout.height)}
      >
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: bannerHeight, paddingBottom: tail }}
        >
          {STAGES.map((stage, index) => (
            <View key={stage.number} onLayout={onSectionLayout(index)} style={styles.column}>
              {index > 0 && <StageDivider stage={stage} />}
              <View style={styles.modules}>
                {stage.modules.map((module) => {
                  const lesson =
                    module.lessonId === null ? null : progressOf(progress, module.lessonId);
                  return (
                    <ModuleRow
                      key={module.number}
                      module={module}
                      tone={stageTone(stage.number)}
                      open={openNumber === module.number}
                      theoryDone={lesson?.theoryCompleted ?? false}
                      practiceDone={lesson?.practiceCompleted ?? false}
                      visible={visible}
                      onToggle={() => toggle(module, index)}
                      onTheory={() =>
                        module.lessonId && openLesson('/lesson/theory', module.lessonId)
                      }
                      onPractice={() =>
                        module.lessonId && openLesson('/lesson/practice', module.lessonId)
                      }
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        <StageBanner
          stages={STAGES}
          current={current}
          onOpen={() =>
            router.push({ pathname: '/stages', params: { current: String(current) } })
          }
          onHeight={setBannerHeight}
        />
      </View>

      <ConfirmDialog
        visible={soon !== null}
        title="Próximamente"
        message={
          soon === null
            ? ''
            : `El módulo ${soon.number}, «${soon.title}», estará disponible muy pronto.`
        }
        confirmLabel="Entendido"
        confirmTone="brand"
        onConfirm={() => setSoon(null)}
        onCancel={() => setSoon(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  // En pantallas anchas la ruta es una columna centrada, no una fila estirada.
  column: {
    width: '100%',
    maxWidth: controls.pathMaxWidth,
    alignSelf: 'center',
  },
  modules: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
