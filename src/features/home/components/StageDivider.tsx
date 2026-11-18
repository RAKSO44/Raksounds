import { StyleSheet, Text, View } from 'react-native';

import { Stage } from '@/domain/lessons';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

interface StageDividerProps {
  stage: Stage;
}

/**
 * La línea que separa una etapa de la anterior en la ruta, con su título en
 * medio (como las secciones de Duolingo). Al llegar arriba, la tarjeta fija
 * cambia a esta etapa.
 */
export function StageDivider({ stage }: StageDividerProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Etapa ${stage.number}: ${stage.title}`}
      style={styles.row}
    >
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.title, { color: colors.textSecondary }]}>{stage.title}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: controls.stageDividerStroke,
  },
  title: {
    ...typography.question,
    // El título puede envolverse en dos líneas, nunca recortarse.
    maxWidth: '65%',
    flexShrink: 0,
    textAlign: 'center',
  },
});
