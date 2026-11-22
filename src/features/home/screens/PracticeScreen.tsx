import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { hasPractice, moduleById, ModuleId, practiceIntro } from '@/domain/lessons';
import {
  AnswerFeedbackSheet,
  BottomActionBar,
  ConfirmDialog,
  ExerciseProgressBar,
  Header,
} from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { LessonExerciseView } from '../components/practice/LessonExerciseView';
import { RichText } from '../components/theory/RichText';
import { useClipPlayer } from '../hooks/useClipPlayer';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { feedbackTitle } from '../labels';
import { useLessonProgressStore } from '../progressStore';

/** "3,7,9" → [3, 7, 9]; vacío o ausente → `null` (el intento entero). */
function parsePositions(raw: string | undefined): number[] | null {
  const positions = (raw ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  return positions.length > 0 ? positions : null;
}

/**
 * La práctica de un módulo: 15 ejercicios seguidos, con corrección inmediata.
 * Al responder el último se registra el intento y se REEMPLAZA esta pantalla
 * por el resultado, para no volver a ejercicios ya respondidos.
 *
 * Con `retry` ("Reintentar fallos") son solo esas posiciones, regeneradas; lo
 * que se acierte se suma a los `base` aciertos que ya tenía el intento.
 */
export function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: string; retry?: string; base?: string }>();
  const module = moduleById(params.module);
  const retry = useMemo(() => parsePositions(params.retry), [params.retry]);

  // Enlace viejo o a un módulo que aún solo tiene teoría: solo queda volver.
  if (module === undefined || !hasPractice(module.id)) {
    return <Header title="Práctica" onBack={() => router.back()} />;
  }
  return (
    <PracticeRound
      moduleId={module.id}
      moduleNumber={module.number}
      retry={retry}
      base={retry === null ? 0 : Math.max(0, Number(params.base) || 0)}
    />
  );
}

interface PracticeRoundProps {
  moduleId: ModuleId;
  moduleNumber: number;
  retry: readonly number[] | null;
  base: number;
}

function PracticeRound({ moduleId, moduleNumber, retry, base }: PracticeRoundProps) {
  const { colors } = useTheme();
  const router = useRouter();
  // La semilla se fija al abrir la práctica: el intento no cambia al repintar.
  const [seed] = useState(() => Date.now() >>> 0);
  const session = usePracticeSession(moduleId, seed, retry);
  const player = useClipPlayer();
  const recordPractice = useLessonProgressStore((state) => state.recordPractice);
  const recordRetry = useLessonProgressStore((state) => state.recordRetry);

  // Lo que se lee antes del primer ejercicio (si el módulo lo trae).
  const intro = practiceIntro(moduleId);
  const [introRead, setIntroRead] = useState(intro === null);

  const [leaving, setLeaving] = useState(false);
  const [actionBarHeight, setActionBarHeight] = useState(0);

  const revealed = session.phase === 'revealed';
  const answering = session.phase === 'answering';

  // Pasar de ejercicio corta lo que estuviera sonando del anterior.
  const { stop } = player;
  useEffect(() => stop, [session.index, stop]);

  const { finalScore, failed } = session;
  useEffect(() => {
    if (finalScore === null) return;
    const total = base + finalScore;
    if (retry === null) recordPractice(moduleId, total);
    else recordRetry(moduleId, total);
    router.replace({
      pathname: '/lesson/result',
      params: {
        module: moduleId,
        score: String(total),
        failed: failed.join(','),
        ...(retry === null ? {} : { gained: String(finalScore) }),
      },
    });
  }, [finalScore, failed, base, retry, recordPractice, recordRetry, moduleId, router]);

  const askToLeave = useCallback(() => setLeaving(true), []);
  useHardwareBack(
    useCallback(() => {
      askToLeave();
      return true;
    }, [askToLeave]),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={`Módulo ${moduleNumber} · Práctica`} onBack={askToLeave} />

      <View style={styles.progress}>
        <ExerciseProgressBar
          completed={session.index}
          total={Math.max(1, session.exercises.length - 1)}
        />
      </View>

      {introRead ? (
        <>
          <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
            {session.exercise !== null && (
              <Animated.View
                key={session.index}
                entering={FadeIn.duration(motion.enter)}
                style={styles.exercise}
              >
                <LessonExerciseView
                  exercise={session.exercise}
                  revealed={revealed}
                  player={player}
                  onAnswer={session.setAnswer}
                />
              </Animated.View>
            )}
            {!player.ready && (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando sonidos…</Text>
            )}
          </ScrollView>

          {session.exercise !== null && (
            <AnswerFeedbackSheet
              visible={revealed}
              result={session.isCorrect === true ? 'correct' : 'wrong'}
              title={feedbackTitle(session.isCorrect ?? false)}
              detail={session.exercise.explanation}
              bottomInset={actionBarHeight}
            />
          )}

          <BottomActionBar
            label={answering ? 'Comprobar' : 'Continuar'}
            disabled={answering && session.answer === null}
            transparent={revealed}
            onPress={answering ? session.confirm : session.advance}
            onHeight={setActionBarHeight}
          />
        </>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
            {intro !== null && (
              <View style={styles.exercise}>
                <RichText segments={intro} strong centered />
              </View>
            )}
          </ScrollView>
          <BottomActionBar label="Continuar" onPress={() => setIntroRead(true)} />
        </>
      )}

      <ConfirmDialog
        visible={leaving}
        title="¿Salir de la práctica?"
        message="Perderás las respuestas de este intento y tendrás que empezar de nuevo."
        confirmLabel="Salir"
        cancelLabel="Seguir"
        onConfirm={() => router.back()}
        onCancel={() => setLeaving(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progress: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  exercise: {
    flex: 1,
    justifyContent: 'center',
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
