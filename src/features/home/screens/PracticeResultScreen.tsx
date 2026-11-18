import { useCallback, useEffect, useRef, useState } from 'react';
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
import { BottomActionBar, Header } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { useLessonSounds } from '../hooks/useLessonSounds';
import { useLessonProgressStore } from '../progressStore';

/**
 * Cuenta de `from` a `to` de uno en uno tras una pausa: el "+3" que sube el
 * resultado al volver de "Reintentar fallos". Sin nada que sumar, se queda
 * quieto en `to`.
 */
function useCountUp(from: number, to: number): number {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (from >= to) return;
    let current = from;
    let ticker: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      ticker = setInterval(() => {
        current += 1;
        setValue(current);
        if (current >= to) clearInterval(ticker);
      }, motion.scoreTick);
    }, motion.scoreGainDelay);
    return () => {
      clearTimeout(start);
      clearInterval(ticker);
    };
  }, [from, to]);
  return value;
}

/**
 * Resultado de un intento: aciertos de 15 y si con eso se completa la práctica
 * (12 o más). No aprobar no penaliza, y un completado anterior nunca se pierde.
 *
 * Si hubo fallos, "Reintentar fallos" (amarillo, sobre "Continuar") repite
 * SOLO esas posiciones con ejercicios nuevos; al volver, el resultado suma lo
 * recuperado ("+3", 12 → 15) y eso cuenta para completar la práctica.
 */
export function PracticeResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    module?: string;
    score?: string;
    gained?: string;
    failed?: string;
  }>();
  const module = moduleById(params.module);
  const score = Math.max(0, Math.min(PRACTICE_LENGTH, Number(params.score) || 0));
  const gained = Math.max(0, Math.min(score, Number(params.gained) || 0));
  const failed = params.failed ?? '';
  const passed = isPracticePassed(score);
  const shown = useCountUp(score - gained, score);
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

  const retryFailed = () =>
    module !== undefined &&
    router.replace({
      pathname: '/lesson/practice',
      params: { module: module.id, retry: failed, base: String(score) },
    });

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
            {shown}/{PRACTICE_LENGTH}
          </Text>
          {gained > 0 && (
            <Animated.Text
              entering={FadeInDown.duration(motion.enter).delay(motion.stagger)}
              style={[styles.gain, { color: colors.successText }]}
            >
              +{gained}
            </Animated.Text>
          )}
          <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
          {progress !== null && progress.bestScore !== null && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Tu mejor resultado: {progress.bestScore}/{PRACTICE_LENGTH} · intentos:{' '}
              {progress.attempts}
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      <BottomActionBar
        label="Continuar"
        onPress={finish}
        secondary={
          failed !== '' && score < PRACTICE_LENGTH
            ? { label: 'Reintentar fallos', tone: 'warning', onPress: retryFailed }
            : undefined
        }
      />
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
  gain: {
    ...typography.headerTitle,
  },
  message: {
    ...typography.question,
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
});
