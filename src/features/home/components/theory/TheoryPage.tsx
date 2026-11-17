import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing, typography, useTheme } from '@/shared/theme';

interface TheoryPageLayoutProps {
  /** La idea de la página, en una o dos frases. */
  statement: string;
  /** Qué probar ahora ("Toca al menos 3 notas"). Es una sugerencia: no bloquea. */
  hint: string;
  /** Ya se hizo la interacción sugerida. */
  done: boolean;
  children: ReactNode;
}

/**
 * Esqueleto de las páginas de teoría del Módulo 2: la idea arriba, lo
 * interactivo en medio y debajo una sugerencia de qué probar, que pasa a verde
 * al cumplirse. Nunca bloquea el avance.
 */
export function TheoryPageLayout({ statement, hint, done, children }: TheoryPageLayoutProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.page}>
      <Text style={[styles.statement, { color: colors.textPrimary }]}>{statement}</Text>
      <View style={styles.body}>{children}</View>
      <View style={styles.hint}>
        <MaterialCommunityIcons
          name={done ? 'check-circle' : 'gesture-tap'}
          size={20}
          color={done ? colors.successText : colors.textSecondary}
        />
        <Text
          style={[styles.hintText, { color: done ? colors.successText : colors.textSecondary }]}
        >
          {hint}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  statement: {
    ...typography.headerTitle,
    textAlign: 'center',
  },
  body: {
    gap: spacing.lg,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  hintText: {
    ...typography.chip,
    flexShrink: 1,
    textAlign: 'center',
  },
});
