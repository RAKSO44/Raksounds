import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IntervalId, RoundSummary } from '@/domain/ear-training';
import { SectionCard } from '@/shared/design-system';
import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { INTERVAL_COMPACT_LABELS } from '../labels';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface RoundSummaryViewProps {
  summary: RoundSummary;
}

/** Segundos con un decimal: "2.4 s". */
function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * Resumen de la ronda.
 *
 * La jerarquía es la de un recuento de fin de lección: primero el dato que
 * resume todo (el porcentaje, a tamaño de titular y del color que le
 * corresponde al resultado), después las dos medidas de "cómo" se respondió y
 * por último el detalle por intervalo. Las tarjetas entran escalonadas de
 * arriba abajo, en el mismo orden en que se leen.
 */
export function RoundSummaryView({ summary }: RoundSummaryViewProps) {
  const { colors } = useTheme();
  const percentage = Math.round(summary.accuracy * 100);

  // El color del titular es el propio resultado: verde si dominó la ronda,
  // ámbar si va a medias y rojo si toca repetirla.
  const heroColor =
    summary.accuracy >= 0.8
      ? colors.successText
      : summary.accuracy >= 0.5
        ? colors.warningText
        : colors.dangerText;

  return (
    <View style={styles.container}>
      <Row index={0}>
        <View style={styles.hero}>
          <Text style={[styles.heroValue, { color: heroColor }]}>{percentage}%</Text>
          <Text style={[styles.heroCaption, { color: colors.textSecondary }]}>
            {summary.correctCount} de {summary.total} correctas
          </Text>
        </View>
      </Row>

      <Row index={1}>
        <View style={styles.statsRow}>
          <Stat
            icon="timer-outline"
            value={formatSeconds(summary.averageMs)}
            label="por pregunta"
          />
          <Stat
            icon="replay"
            // Repeticiones: cuántas veces, de media, hubo que volver a oír una
            // nota YA escuchada en la misma pregunta. Con un decimal (como su
            // vecina de tiempo): redondear a entero escondía justo lo que mide
            // —repetir en tres preguntas de diez se leía como "0".
            value={summary.averageReplays.toFixed(1)}
            label="repeticiones por pregunta"
          />
        </View>
      </Row>

      <Row index={2}>
        <SectionCard icon="flash" title="Tu acierto más rápido">
          {summary.fastestInterval === null || summary.fastestMs === null ? (
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Esta vez no hubo aciertos: vuelve a intentarlo.
            </Text>
          ) : (
            <View style={styles.chips}>
              <IntervalChip interval={summary.fastestInterval} tone="success" />
              <Text style={[styles.detail, { color: colors.textSecondary }]}>
                en {formatSeconds(summary.fastestMs)}
              </Text>
            </View>
          )}
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
                <IntervalChip key={interval} interval={interval} tone="danger" />
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

/**
 * Etiqueta de un intervalo del resumen. Verde si es el acierto más rápido,
 * rojo si es uno de los fallados; el color es el MISMO en claro y oscuro
 * (tokens `result*`), porque es un dato que hay que reconocer de un vistazo y
 * no una superficie del tema.
 */
function IntervalChip({ interval, tone }: { interval: IntervalId; tone: 'success' | 'danger' }) {
  const { colors } = useTheme();
  const background = tone === 'success' ? colors.resultSuccess : colors.resultDanger;
  const foreground = tone === 'success' ? colors.resultSuccessText : colors.resultDangerText;

  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text style={[styles.chipLabel, { color: foreground }]}>
        {INTERVAL_COMPACT_LABELS[interval]}
      </Text>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statValueRow}>
        {/* El icono es parte de la cifra, no un adorno: va de su mismo color. */}
        <MaterialCommunityIcons name={icon} size={22} color={colors.textPrimary} />
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
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
    gap: spacing.xs,
    paddingVertical: spacing.lg,
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
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: controls.statIconGap,
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    // Menos redondeado que una píldora: es una etiqueta de dato, no un botón.
    borderRadius: radii.sm,
  },
  chipLabel: {
    ...typography.chip,
  },
});
