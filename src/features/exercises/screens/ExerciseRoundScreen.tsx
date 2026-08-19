import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EXERCISE_LEVELS, levelByNumber, parseExerciseMode } from '@/domain/ear-training';
import { Header } from '@/shared/design-system';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { MODE_LABELS } from '../labels';
import {
  AnswerFeedback,
  BottomActionBar,
  ExerciseProgressBar,
  ExerciseView,
  RoundSummaryView,
} from '../components';
import { useExerciseRound } from '../hooks/useExerciseRound';
import { useNotePlayer } from '../hooks/useNotePlayer';

/**
 * Una ronda completa: diez ejercicios y su resumen.
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
  const player = useNotePlayer();

  const revealed = round.phase === 'revealed';
  const answering = round.phase === 'answering';
  const completed = round.phase === 'summary' ? round.total : round.index + (revealed ? 1 : 0);

  // Salir de la ronda vuelve al menú de Ejercicios, no a la elección de nivel:
  // la ronda ya terminó y volver atrás paso a paso no tendría sentido.
  const leave = () => router.dismissAll();

  // El botón de abajo es siempre el mismo; lo único que cambia con la fase es
  // qué significa pulsarlo: corregir, pasar al siguiente o cerrar la ronda.
  const advance = answering ? round.confirm : revealed ? round.advance : leave;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={MODE_LABELS[mode]} onBack={leave} />

      <View style={styles.progress}>
        <ExerciseProgressBar completed={completed} total={round.total} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {round.summary !== null ? (
          <RoundSummaryView summary={round.summary} />
        ) : (
          round.exercise !== null && (
            <Animated.View
              // Remontar por ejercicio hace que cada pregunta entre con un
              // fundido corto en vez de cambiar de golpe bajo el dedo.
              key={round.index}
              entering={FadeIn.duration(motion.enter)}
            >
              <ExerciseView
                exercise={round.exercise}
                selected={round.selected}
                revealed={revealed}
                player={player}
                onSelect={round.select}
              />
            </Animated.View>
          )
        )}

        {!player.ready && round.phase !== 'summary' && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando sonidos…</Text>
        )}
      </ScrollView>

      <BottomActionBar
        label={answering ? 'Confirmar' : 'Continuar'}
        disabled={answering && round.selected === null}
        onPress={advance}
      >
        {revealed && round.exercise !== null && round.isCorrect !== null && (
          <AnswerFeedback correct={round.isCorrect} answer={round.exercise.answer} />
        )}
      </BottomActionBar>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
