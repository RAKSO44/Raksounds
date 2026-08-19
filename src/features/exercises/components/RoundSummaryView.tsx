import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RoundSummary } from '@/domain/ear-training';
import { SectionCard } from '@/shared/design-system';
import { motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { intervalLabel, INTERVAL_COMPACT_LABELS } from '../labels';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface RoundSummaryViewProps {
  summary: RoundSummary;
}

/** Segundos con un decimal: "2.4 s". */
function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * Resumen de la ronda. Las tarjetas entran escalonadas de arriba abajo, como el
 * recuento de fin de lección de Duolingo: primero el resultado global y después
 * el detalle.
 */
export function RoundSummaryView({ summary }: RoundSummaryViewProps) {
  const { colors } = useTheme();
  const percentage = Math.round(summary.accuracy * 100);
  const perfect = summary.correctCount === summary.total;

  return (
    <View style={styles.container}>
      <Row index={0}>
        <View style={[styles.hero, { backgroundColor: colors.brand }]}>
          <MaterialCommunityIcons
            name={perfect ? 'trophy' : 'chart-donut'}
            size={44}
            color={colors.textOnBrand}
          />
          <Text style={[styles.heroValue, { color: colors.textOnBrand }]}>{percentage}%</Text>
          <Text style={[styles.heroCaption, { color: colors.textOnBrand }]}>
            {summary.correctCount} de {summary.total} correctas
          </Text>
        </View>
      </Row>

      <Row index={1}>
        <View style={styles.statsRow}>
          <Stat
            icon="timer-outline"
            label="Tiempo medio"
            value={formatSeconds(summary.averageMs)}
          />
          <Stat icon="fire" label="Mejor racha" value={String(summary.bestStreak)} />
        </View>
      </Row>

      <Row index={2}>
        <SectionCard icon="flash" title="Tu acierto más rápido">
          <Text style={[styles.detail, { color: colors.textSecondary }]}>
            {summary.fastestInterval === null || summary.fastestMs === null
              ? 'Esta vez no hubo aciertos: vuelve a intentarlo.'
              : `${intervalLabel(summary.fastestInterval)} en ${formatSeconds(summary.fastestMs)}`}
          </Text>
        </SectionCard>
      </Row>

      <Row index={3}>
        <SectionCard icon="ear-hearing" title="Para repasar">
          {summary.missedIntervals.length === 0 ? (
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Ningún intervalo se te resistió. ¡Sube de nivel!
            </Text>
          ) : (
            <View style={styles.chips}>
              {summary.missedIntervals.map((interval) => (
                <View key={interval} style={[styles.chip, { backgroundColor: colors.dangerTint }]}>
                  <Text style={[styles.chipLabel, { color: colors.dangerText }]}>
                    {INTERVAL_COMPACT_LABELS[interval]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </Row>
    </View>
  );
}

/** Bloque del resumen, con la entrada escalonada según su posición. */
function Row({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(motion.enter).delay(index * motion.stagger)}>
      {children}
    </Animated.View>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.textSecondary} />
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  heroValue: {
    ...typography.heroValue,
  },
  heroCaption: {
    ...typography.chip,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  statValue: {
    ...typography.stat,
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  detail: {
    ...typography.chip,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  chipLabel: {
    ...typography.chip,
  },
});
