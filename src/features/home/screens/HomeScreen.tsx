import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ModuleId, PathModule, progressOf, STAGES } from '@/domain/lessons';
import { ConfirmDialog, Header } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { controls, spacing, useTheme } from '@/shared/theme';

import { ModuleRow } from '../components/ModuleRow';
import { StageBanner } from '../components/StageBanner';
import { useLessonProgressStore } from '../progressStore';

/**
 * El Home ("Inicio"): las etapas del roadmap, cada una con su tarjeta fija
 * arriba y sus módulos debajo. Tocar un módulo lo abre en tarjeta (y cierra el
 * que estuviera abierto); tocarlo de nuevo lo cierra. Nada está bloqueado: un
 * módulo sin lección todavía solo avisa de que llega pronto.
 */
export function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const progress = useLessonProgressStore((state) => state.modules);
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [soon, setSoon] = useState<PathModule | null>(null);
  const [visible, setVisible] = useState(true);

  // Al salir (a una lección, a otra pestaña) el módulo abierto se cierra; y
  // mientras no se ve, los nodos no animan sus cambios de estado.
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => {
        setVisible(false);
        setOpenNumber(null);
      };
    }, []),
  );

  useHardwareBack(
    useCallback(() => {
      if (openNumber === null) return false;
      setOpenNumber(null);
      return true;
    }, [openNumber]),
  );

  const toggle = (module: PathModule) => {
    if (module.lessonId === null) {
      setSoon(module);
      return;
    }
    setOpenNumber((current) => (current === module.number ? null : module.number));
  };

  const openLesson = (pathname: '/lesson/theory' | '/lesson/practice', id: ModuleId) =>
    router.push({ pathname, params: { module: id } });

  // Hijos del ScrollView: [tarjeta etapa 1, módulos 1, tarjeta etapa 2, …]. Las
  // tarjetas son los índices pares, y son las que quedan fijas arriba.
  const stickyIndices = STAGES.map((_, index) => index * 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Inicio"
        action={{
          icon: 'cog',
          accessibilityLabel: 'Configuración',
          onPress: () => router.push('/settings'),
        }}
      />
      <ScrollView stickyHeaderIndices={stickyIndices} contentContainerStyle={styles.content}>
        {STAGES.flatMap((stage) => [
          // Fondo a todo el ancho: lo que pasa por debajo no asoma por los lados.
          <View key={`banner-${stage.number}`} style={{ backgroundColor: colors.background }}>
            <View style={styles.column}>
              <StageBanner stage={stage} />
            </View>
          </View>,
          <View key={`modules-${stage.number}`} style={[styles.column, styles.modules]}>
            {stage.modules.map((module) => {
              const lesson =
                module.lessonId === null ? null : progressOf(progress, module.lessonId);
              return (
                <ModuleRow
                  key={module.number}
                  module={module}
                  open={openNumber === module.number}
                  theoryDone={lesson?.theoryCompleted ?? false}
                  practiceDone={lesson?.practiceCompleted ?? false}
                  visible={visible}
                  onToggle={() => toggle(module)}
                  onTheory={() => module.lessonId && openLesson('/lesson/theory', module.lessonId)}
                  onPractice={() =>
                    module.lessonId && openLesson('/lesson/practice', module.lessonId)
                  }
                />
              );
            })}
          </View>,
        ])}
      </ScrollView>

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
  content: {
    paddingBottom: spacing.xl,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
