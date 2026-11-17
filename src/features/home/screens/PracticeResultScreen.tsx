import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  isPracticePassed,
  moduleById,
  PRACTICE_LENGTH,
  PRACTICE_PASS_SCORE,
  progressOf,
} from '@/domain/lessons';
import { BottomActionBar, Header, PushButton } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { useLessonSounds } from '../hooks/useLessonSounds';
import { useLessonProgressStore } from '../progressStore';

/**
 * Resultado de un intento: aciertos de 15 y si con eso se completa la práctica
 * (12 o más). No aprobar no penaliza: se puede repetir al momento, y un
 * completado anterior nunca se pierde.
 */
export function PracticeResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: string; score?: string }>();
  const module = moduleById(params.module);
  const score = Math.max(0, Math.min(PRACTICE_LENGTH, Number(params.score) || 0));
  const passed = isPracticePassed(score);
  const progress = useLessonProgressStore((state) =>
    module === undefined ? null : progressOf(state.modules, module.id),
  );

  const play = useLessonSounds();
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play(passed ? 'cleared' : 'failed');
  }, [passed, play]);

  const finish = useCallback(() => router.back(), [router]);
  // Aquí "atrás" es lo mismo que "Continuar": vuelve a la ruta.
  useHardwareBack(
    useCallback(() => {
      finish();
      return true;
    }, [finish]),
  );

  const retry = () =>
    module !== undefined &&
    router.replace({ pathname: '/lesson/practice', params: { module: module.id } });

  const color = passed ? colors.successText : colors.dangerText;
  const message = passed
    ? progress?.theoryCompleted
      ? '¡Módulo completado!'
      : '¡Práctica completada! Te falta la teoría para completar el módulo.'
    : `Necesitas ${PRACTICE_PASS_SCORE} aciertos para completar la práctica. ¡Inténtalo otra vez!`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={module ? `Módulo ${module.number} · Resultado` : 'Resultado'} />

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(motion.enter)} style={styles.hero}>
          <MaterialCommunityIcons
            name={passed ? 'trophy' : 'refresh-circle'}
            size={64}
            color={color}
          />
          <Text style={[styles.score, { color }]}>
            {score}/{PRACTICE_LENGTH}
          </Text>
          <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
          {progress !== null && progress.bestScore !== null && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Tu mejor resultado: {progress.bestScore}/{PRACTICE_LENGTH} · intentos:{' '}
              {progress.attempts}
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(motion.enter).delay(motion.stagger)}
          style={styles.center}
        >
          <PushButton
            variant="selectable"
            icon="replay"
            iconPlacement="start"
            label="Volver a practicar"
            onPress={retry}
          />
        </Animated.View>
      </ScrollView>

      <BottomActionBar label="Continuar" onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    ...typography.heroValue,
  },
  message: {
    ...typography.question,
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
  },
});
