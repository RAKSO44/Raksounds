import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EXERCISE_LEVELS, levelByNumber, parseExerciseMode } from '@/domain/ear-training';
import { ConfirmDialog, Header } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { MODE_LABELS } from '../labels';
import { encodeRoundSummary } from '../summaryParams';
import {
  AnswerFeedbackSheet,
  BottomActionBar,
  ExerciseProgressBar,
  ExerciseView,
} from '../components';
import { useExerciseRound } from '../hooks/useExerciseRound';
import { useNotePlayer } from '../hooks/useNotePlayer';

/**
 * Una ronda completa: diez ejercicios. El resultado vive en su propia pantalla,
 * a la que se salta al responder el último.
 *
 * La pantalla solo compone. Qué se pregunta lo decide el dominio (el generador
 * de la ronda) y en qué punto está la ronda lo decide `useExerciseRound`; aquí
 * únicamente se elige qué ejercicio pintar y qué dice el botón de abajo.
 */
export function ExerciseRoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; level?: string }>();

  // Parámetros inválidos (enlace viejo o escrito a mano) caen en la ronda más
  // sencilla en vez de dejar la pantalla en blanco.
  const mode = parseExerciseMode(params.mode) ?? 'mixed';
  const level = levelByNumber(Number(params.level)) ?? EXERCISE_LEVELS[0];

  const round = useExerciseRound({ mode, level });
  const notePlayer = useNotePlayer();

  const [leaving, setLeaving] = useState(false);
  const [actionBarHeight, setActionBarHeight] = useState(0);

  const revealed = round.phase === 'revealed';
  const answering = round.phase === 'answering';

  // Cada nota que suena se le cuenta al ejercicio en curso; el hook decide si
  // es la primera vez (normal) o una repetición, que es lo que mide el resumen.
  const registerListen = round.registerListen;
  const player = useMemo(
    () => ({
      ...notePlayer,
      press: (key: string, midi: number) => {
        // Solo cuenta si de verdad va a sonar: con las muestras aún cargando
        // el motor descarta la pulsación, y contarla inflaría el resumen.
        if (notePlayer.ready) registerListen(key);
        notePlayer.press(key, midi);
      },
    }),
    [notePlayer, registerListen],
  );

  // Terminada la ronda, el resultado es otra pantalla: se REEMPLAZA la ronda
  // para que no se pueda volver a unos ejercicios ya respondidos.
  useEffect(() => {
    if (round.summary === null) return;
    router.replace({
      pathname: '/exercise/summary',
      params: { mode, summary: encodeRoundSummary(round.summary) },
    });
  }, [round.summary, router, mode]);

  // Salir de la ronda vuelve al menú de Ejercicios, no a la elección de nivel:
  // lo que se abandona es la ronda entera.
  const leave = useCallback(() => router.dismissAll(), [router]);
  // Tanto la flecha como el "atrás" del sistema piden confirmación: una ronda a
  // medias no se recupera, así que salir nunca puede ser un accidente.
  const askToLeave = useCallback(() => setLeaving(true), []);
  useHardwareBack(
    useCallback(() => {
      askToLeave();
      return true;
    }, [askToLeave]),
  );

  // El botón de abajo es siempre el mismo; lo único que cambia con la fase es
  // qué significa pulsarlo: corregir o pasar al siguiente.
  const advance = answering ? round.confirm : round.advance;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={MODE_LABELS[mode]} onBack={askToLeave} />

      <View style={styles.progress}>
        {/* La barra avanza al PASAR de ejercicio ("Continuar"), no al corregir:
            mide cuánta ronda queda, no si ya respondiste. Sus pasos son los
            saltos entre ejercicios (uno menos que ejercicios hay), de modo que
            al llegar al último ya está llena. */}
        <ExerciseProgressBar completed={round.index} total={Math.max(1, round.total - 1)} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // El ejercicio se reparte el alto disponible en vez de amontonarse
        // arriba: la pregunta queda centrada y las opciones caen bajo ella.
        style={styles.scroll}
      >
        {round.exercise !== null && (
          <Animated.View
            // Remontar por ejercicio hace que cada pregunta entre con un
            // fundido corto en vez de cambiar de golpe bajo el dedo.
            key={round.index}
            entering={FadeIn.duration(motion.enter)}
            style={styles.exercise}
          >
            <ExerciseView
              exercise={round.exercise}
              selected={round.selected}
              revealed={revealed}
              player={player}
              onSelect={round.select}
            />
          </Animated.View>
        )}

        {!player.ready && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando sonidos…</Text>
        )}
      </ScrollView>

      {/* La hoja se queda montada toda la ronda: si se desmontara al pasar de
          ejercicio desaparecería de golpe en vez de bajar deslizándose. Lo que
          muestra lo congela ella misma mientras baja. */}
      {round.exercise !== null && (
        <AnswerFeedbackSheet
          visible={revealed}
          correct={round.isCorrect ?? false}
          kind={round.exercise.kind}
          answer={round.exercise.answer}
          chosen={round.selected ?? round.exercise.answer}
          bottomInset={actionBarHeight}
        />
      )}

      <BottomActionBar
        label={answering ? 'Confirmar' : 'Continuar'}
        disabled={answering && round.selected === null}
        transparent={revealed}
        onPress={advance}
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
