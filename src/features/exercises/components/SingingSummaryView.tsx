import { StyleSheet, View } from 'react-native';

import { SingingSummary } from '@/domain/singing';
import { SectionCard } from '@/shared/design-system';
import { spacing } from '@/shared/theme';

import { singingTargetLabel, tendencyLabel } from '../labels';
import {
  formatSeconds,
  SummaryChip,
  SummaryChips,
  SummaryDetail,
  SummaryHero,
  SummaryRow,
  SummaryStat,
  SummaryStats,
} from './SummaryParts';

interface SingingSummaryViewProps {
  summary: SingingSummary;
}

/**
 * Resumen de una ronda de entonación. Misma jerarquía que el de identificación
 * (titular, cifras, detalle), pero la cifra que importa aquí es la AFINACIÓN:
 * cuántos cents, de media, se separó la voz de la nota cuando dio con ella, y
 * hacia dónde tiende a irse.
 */
export function SingingSummaryView({ summary }: SingingSummaryViewProps) {
  return (
    <View style={styles.container}>
      <SummaryRow index={0}>
        <SummaryHero
          accuracy={summary.accuracy}
          correctCount={summary.correctCount}
          closeCount={summary.closeCount}
          total={summary.total}
        />
      </SummaryRow>

      <SummaryRow index={1}>
        <SummaryStats>
          <SummaryStat
            icon="tune-vertical"
            value={
              summary.averageCentsOff === null ? '—' : `${Math.round(summary.averageCentsOff)}`
            }
            label="cents de desvío medio"
          />
          <SummaryStat
            icon="timer-outline"
            value={formatSeconds(summary.averageMs)}
            label="por pregunta"
          />
        </SummaryStats>
      </SummaryRow>

      <SummaryRow index={2}>
        <SectionCard icon="microphone" title="Tu afinación">
          <SummaryDetail>{tendencyLabel(summary.tendencyCents)}</SummaryDetail>
        </SectionCard>
      </SummaryRow>

      <SummaryRow index={3}>
        <SectionCard icon="ear-hearing" title="Para repasar">
          {summary.missedTargets.length === 0 ? (
            <SummaryDetail>Todo afinado. ¡Sube de nivel!</SummaryDetail>
          ) : (
            <SummaryChips>
              {summary.missedTargets.map((target) => {
                const label = singingTargetLabel(target);
                return <SummaryChip key={label} label={label} tone="danger" />;
              })}
            </SummaryChips>
          )}
        </SectionCard>
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
