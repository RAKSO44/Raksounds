import { StyleSheet, View } from 'react-native';

import { RoundSummary } from '@/domain/ear-training';
import { SectionCard } from '@/shared/design-system';
import { spacing } from '@/shared/theme';

import { INTERVAL_COMPACT_LABELS } from '../labels';
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

interface RoundSummaryViewProps {
  summary: RoundSummary;
}

/**
 * Resumen de una ronda de identificación.
 *
 * La jerarquía es la de un recuento de fin de lección: primero el dato que
 * resume todo (el porcentaje), después las dos medidas de "cómo" se respondió y
 * por último el detalle por intervalo. Las tarjetas entran escalonadas de
 * arriba abajo, en el mismo orden en que se leen.
 */
export function RoundSummaryView({ summary }: RoundSummaryViewProps) {
  return (
    <View style={styles.container}>
      <SummaryRow index={0}>
        <SummaryHero
          accuracy={summary.accuracy}
          correctCount={summary.correctCount}
          total={summary.total}
        />
      </SummaryRow>

      <SummaryRow index={1}>
        <SummaryStats>
          <SummaryStat
            icon="timer-outline"
            value={formatSeconds(summary.averageMs)}
            label="por pregunta"
          />
          <SummaryStat
            icon="replay"
            // Repeticiones: cuántas veces, de media, hubo que volver a oír una
            // nota YA escuchada en la misma pregunta. Con un decimal (como su
            // vecina de tiempo): redondear a entero escondía justo lo que mide
            // —repetir en tres preguntas de diez se leía como "0".
            value={summary.averageReplays.toFixed(1)}
            label="repeticiones por pregunta"
          />
        </SummaryStats>
      </SummaryRow>

      <SummaryRow index={2}>
        <SectionCard icon="flash" title="Tu acierto más rápido">
          {summary.fastestInterval === null || summary.fastestMs === null ? (
            <SummaryDetail>Esta vez no hubo aciertos: vuelve a intentarlo.</SummaryDetail>
          ) : (
            <SummaryChips>
              <SummaryChip
                label={INTERVAL_COMPACT_LABELS[summary.fastestInterval]}
                tone="success"
              />
              <SummaryDetail>en {formatSeconds(summary.fastestMs)}</SummaryDetail>
            </SummaryChips>
          )}
        </SectionCard>
      </SummaryRow>

      <SummaryRow index={3}>
        <SectionCard icon="ear-hearing" title="Para repasar">
          {summary.missedIntervals.length === 0 ? (
            <SummaryDetail>Ningún intervalo se te resistió. ¡Sube de nivel!</SummaryDetail>
          ) : (
            <SummaryChips>
              {summary.missedIntervals.map((interval) => (
                <SummaryChip
                  key={interval}
                  label={INTERVAL_COMPACT_LABELS[interval]}
                  tone="danger"
                />
              ))}
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
