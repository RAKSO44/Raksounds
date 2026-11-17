import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TapExercise } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { useTapRun } from '../../hooks/useTapRun';
import { BeatMarks } from '../BeatMarks';
import { PulseLight } from '../PulseLight';
import { TapPad } from '../TapPad';
import { ExerciseViewProps } from './types';

/**
 * Tocar siguiendo el pulso. Primero suena una entrada (marcas pequeñas) para
 * agarrar el tempo; después se califica cada golpe. Antes de confirmar se
 * puede repetir la pasada: un tropiezo con el audio no debe costar el
 * ejercicio.
 */
export function TapExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<TapExercise>) {
  const { colors } = useTheme();
  const run = useTapRun(player, exercise);

  useEffect(() => {
    if (run.judgement !== null) onAnswer({ kind: 'tap', passed: run.judgement.passed });
  }, [run.judgement, onAnswer]);

  // Sin guía, la luz y las marcas solo acompañan la entrada.
  const guided = run.beat >= 0 && run.beat < exercise.guideBeats;

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      <View style={styles.light}>
        <PulseLight pulseCount={run.pulseCount} enabled={guided} />
      </View>

      <BeatMarks
        countIn={exercise.countIn}
        beats={exercise.beats}
        active={guided ? run.beat : -1}
        grades={run.judgement?.beats.map((beat) => beat.grade)}
      />

      <Text style={[styles.status, { color: colors.textSecondary }]}>
        {statusText(run.phase, run.beat, exercise.countIn, run.judgement?.hits, exercise.beats)}
      </Text>

      <TapPad disabled={run.phase !== 'running'} onTap={run.tap} />

      {run.phase !== 'running' && !revealed && (
        <View style={styles.center}>
          <PushButton
            variant="selectable"
            tone="secondary"
            icon={run.phase === 'idle' ? 'play' : 'replay'}
            iconPlacement="start"
            label={run.phase === 'idle' ? 'Empezar' : 'Repetir'}
            disabled={!player.ready}
            onPress={run.start}
          />
        </View>
      )}
    </View>
  );
}

function statusText(
  phase: string,
  beat: number,
  countIn: number,
  hits: number | undefined,
  beats: number,
): string {
  if (phase === 'failed') return 'No se pudo reproducir el pulso. Inténtalo otra vez.';
  if (phase === 'idle') return `Escucharás ${countIn} golpes de entrada y luego tocas tú.`;
  if (phase === 'running') return beat < countIn ? 'Escucha la entrada…' : '¡Toca!';
  return `Acertaste ${hits ?? 0} de ${beats} pulsos.`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  prompt: {
    ...typography.question,
    textAlign: 'center',
  },
  light: {
    alignItems: 'center',
  },
  status: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
  },
});
