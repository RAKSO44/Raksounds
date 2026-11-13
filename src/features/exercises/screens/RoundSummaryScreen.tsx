import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { parseExerciseMode } from '@/domain/ear-training';
import { Header } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { spacing, useTheme } from '@/shared/theme';

import { MODE_LABELS } from '../labels';
import { decodeRoundSummary } from '../summaryParams';
import { BottomActionBar, RoundSummaryView } from '../components';

/**
 * Resultado de una ronda terminada. Es una pantalla propia (y no el último
 * paso de la ronda) porque ya no se responde nada: aquí solo se lee.
 *
 * No hay flecha de volver ni vuelta atrás posible: la ronda que la trajo se
 * reemplazó, así que el "atrás" del sistema significa lo mismo que "Continuar"
 * — cerrar el resultado y volver al menú de Ejercicios.
 */
export function RoundSummaryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; summary?: string }>();

  const mode = parseExerciseMode(params.mode) ?? 'mixed';
  const summary = decodeRoundSummary(params.summary);

  const close = useCallback(() => router.dismissAll(), [router]);
  // Aquí "atrás" significa lo mismo que "Continuar": no hay ronda a la que
  // volver, así que cierra el resultado en vez de dejar pasar el evento.
  useHardwareBack(
    useCallback(() => {
      close();
      return true;
    }, [close]),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={MODE_LABELS[mode]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {summary !== null && <RoundSummaryView summary={summary} />}
      </ScrollView>

      <BottomActionBar label="Continuar" onPress={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
