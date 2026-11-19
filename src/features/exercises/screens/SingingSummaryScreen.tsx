import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { parseSingingKind } from '@/domain/singing';
import { BottomActionBar, Header } from '@/shared/design-system';
import { useHardwareBack } from '@/shared/navigation';
import { spacing, useTheme } from '@/shared/theme';

import { SINGING_LABELS } from '../labels';
import { decodeSingingSummary } from '../summaryParams';
import { useRoundEndSound } from '../hooks/useSoundEffects';
import { SingingSummaryView } from '../components';

/**
 * Resultado de una ronda de entonación. Igual que el de identificación: la ronda
 * se reemplazó, así que "atrás" significa lo mismo que "Continuar".
 */
export function SingingSummaryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; summary?: string }>();

  const kind = parseSingingKind(params.kind) ?? 'singInterval';
  const summary = decodeSingingSummary(params.summary);

  useRoundEndSound(summary?.accuracy ?? null);

  const close = useCallback(() => router.dismissAll(), [router]);
  useHardwareBack(
    useCallback(() => {
      close();
      return true;
    }, [close]),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={SINGING_LABELS[kind]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {summary !== null && <SingingSummaryView summary={summary} />}
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
