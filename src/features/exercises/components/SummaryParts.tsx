import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

/**
 * Piezas comunes de los resúmenes de ronda (identificación y entonación): el
 * titular con el porcentaje, las cifras y las etiquetas de lo acertado o
 * fallado. Cada resumen decide QUÉ mostrar; aquí solo vive CÓMO se ve.
 */

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Segundos con un decimal: "2.4 s". */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Bloque del resumen, con la entrada escalonada según su posición. */
export function SummaryRow({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(motion.enter).delay(index * motion.stagger)}>
      {children}
    </Animated.View>
  );
}

/**
 * El dato que resume todo, a tamaño de titular y del color del resultado:
 * verde si dominó la ronda, ámbar si va a medias y rojo si toca repetirla.
 */
export function SummaryHero({
  accuracy,
  correctCount,
  total,
}: {
  accuracy: number;
  correctCount: number;
  total: number;
}) {
  const { colors } = useTheme();
  const color =
    accuracy >= 0.8 ? colors.successText : accuracy >= 0.5 ? colors.warningText : colors.dangerText;

  return (
    <View style={styles.hero}>
      <Text style={[styles.heroValue, { color }]}>{Math.round(accuracy * 100)}%</Text>
      <Text style={[styles.heroCaption, { color: colors.textSecondary }]}>
        {correctCount} de {total} correctas
      </Text>
    </View>
  );
}

/** Fila de cifras del resumen, repartidas a partes iguales. */
export function SummaryStats({ children }: { children: ReactNode }) {
  return <View style={styles.statsRow}>{children}</View>;
}

export function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
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

/** Texto secundario dentro de una tarjeta del resumen. */
export function SummaryDetail({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.detail, { color: colors.textSecondary }]}>{children}</Text>;
}

/** Fila de etiquetas que envuelve a la línea siguiente si no caben. */
export function SummaryChips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

/**
 * Etiqueta de un dato del resumen. Verde para lo acertado y rojo para lo
 * fallado; el color es el MISMO en claro y oscuro (tokens `result*`), porque es
 * un dato que hay que reconocer de un vistazo y no una superficie del tema.
 */
export function SummaryChip({ label, tone }: { label: string; tone: 'success' | 'danger' }) {
  const { colors } = useTheme();
  const background = tone === 'success' ? colors.resultSuccess : colors.resultDanger;
  const foreground = tone === 'success' ? colors.resultSuccessText : colors.resultDangerText;

  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text style={[styles.chipLabel, { color: foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
