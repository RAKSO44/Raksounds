import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { parseSingingKind } from '@/domain/singing';
import { ConfirmDialog, Header, MicButton } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { micHintLabel, SINGING_LABELS, singingDetailLabel, singingTitleLabel } from '../labels';
import { encodeSingingSummary } from '../summaryParams';
import {
  AnswerFeedbackSheet,
  BottomActionBar,
  ExerciseProgressBar,
  SingingExerciseView,
} from '../components';
import { useNoteFormatter } from '../hooks/useNoteFormatter';
import { useNotePlayer } from '../hooks/useNotePlayer';
import { useSingingRound } from '../hooks/useSingingRound';
import { useSingingTake } from '../hooks/useSingingTake';

/**
 * Una ronda de entonación: diez ejercicios en los que se escucha una referencia
 * y se CANTA la respuesta.
 *
 * El flujo es el de los ejercicios de hablar de Duolingo: se toca el micrófono,
 * se canta, y al callar la toma se califica sola y sube la hoja de corrección.
 * No hay "Confirmar": el botón de abajo solo se habilita para continuar.
 */
export function SingingRoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const format = useNoteFormatter();
  const params = useLocalSearchParams<{ kind?: string; level?: string }>();

  const kind = parseSingingKind(params.kind) ?? 'singInterval';
  const round = useSingingRound({ kind, levelNumber: Number(params.level) });
  const notePlayer = useNotePlayer();
  const take = useSingingTake(round.submit);

  const [leaving, setLeaving] = useState(false);
  const [actionBarHeight, setActionBarHeight] = useState(0);

  const revealed = round.phase === 'revealed';

  // Cada pulsación cuenta para "repeticiones"; solo si de verdad va a sonar.
  const registerListen = round.registerListen;
  const player = useMemo(
    () => ({
      ...notePlayer,
      press: (key: string, midi: number) => {
        if (notePlayer.ready) registerListen(key);
        notePlayer.press(key, midi);
      },
      pressChord: (key: string, midis: readonly number[]) => {
        if (notePlayer.ready) registerListen(key);
        notePlayer.pressChord(key, midis);
      },
    }),
    [notePlayer, registerListen],
  );

  const startTake = useCallback(() => {
    // El piano que siga sonando se colaría en la toma como si fuera la voz.
    notePlayer.silence();
    take.start();
  }, [notePlayer, take]);

  useEffect(() => {
    if (round.summary === null) return;
    router.replace({
      pathname: '/exercise/sing-summary',
      params: { kind, summary: encodeSingingSummary(round.summary) },
    });
  }, [round.summary, router, kind]);

  const leave = useCallback(() => router.dismissAll(), [router]);
  const askToLeave = useCallback(() => setLeaving(true), []);
  useHardwareBack(
    useCallback(() => {
      askToLeave();
      return true;
    }, [askToLeave]),
  );

  const micState = revealed ? 'disabled' : take.status;
  const exercise = round.exercise;
  const evaluation = round.evaluation;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={SINGING_LABELS[kind]} onBack={askToLeave} />

      <View style={styles.progress}>
        <ExerciseProgressBar completed={round.index} total={Math.max(1, round.total - 1)} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {exercise !== null && (
          <Animated.View
            key={round.index}
            entering={FadeIn.duration(motion.enter)}
            style={styles.exercise}
          >
            <SingingExerciseView exercise={exercise} revealed={revealed} player={player} />
          </Animated.View>
        )}

        {!player.ready && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando sonidos…</Text>
        )}

        <View style={styles.mic}>
          <MicButton
            state={micState}
            level={take.level}
            onPress={take.status === 'listening' ? take.finish : startTake}
            accessibilityLabel={take.status === 'listening' ? 'Terminar de cantar' : 'Cantar'}
          />
          {!revealed && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {micHintLabel(take.status, take.problem)}
            </Text>
          )}
        </View>
      </ScrollView>

      {exercise !== null && (
        <AnswerFeedbackSheet
          visible={revealed}
          correct={evaluation?.verdict === 'correct'}
          title={evaluation === null ? '' : singingTitleLabel(evaluation.verdict)}
          detail={evaluation === null ? '' : singingDetailLabel(exercise, evaluation, format)}
          bottomInset={actionBarHeight}
        />
      )}

      <BottomActionBar
        label="Continuar"
        disabled={!revealed}
        transparent={revealed}
        onPress={round.advance}
        onHeight={setActionBarHeight}
      />

      <ConfirmDialog
        visible={leaving}
        title="¿Salir de la ronda?"
        message="Perderás el progreso de estos ejercicios y tendrás que empezar de nuevo."
        confirmLabel="Salir"
        cancelLabel="Seguir"
        onConfirm={leave}
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
    gap: spacing.lg,
  },
  exercise: {
    flex: 1,
    justifyContent: 'center',
  },
  mic: {
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
