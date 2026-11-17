import { StyleSheet, Text, View } from 'react-native';

import { Stage } from '@/domain/lessons';
import { elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

interface StageBannerProps {
  stage: Stage;
}

/**
 * La tarjeta fija de una etapa, como la de las secciones de Duolingo: va
 * "pegada" bajo la cabecera mientras se recorren sus módulos, y la de la etapa
 * siguiente la empuja hacia arriba al llegar (lo hace el `ScrollView` con
 * `stickyHeaderIndices`). El fondo opaco del contenedor tapa lo que pasa por
 * debajo.
 *
 * Cada etapa alterna entre el morado de marca y el azul secundario, para que
 * el cambio de etapa se note de un vistazo.
 */
export function StageBanner({ stage }: StageBannerProps) {
  const { colors } = useTheme();
  const odd = stage.number % 2 === 1;
  const face = odd ? colors.brand : colors.secondary;
  const lip = odd ? colors.brandShadow : colors.secondaryShadow;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View
        accessibilityRole="header"
        style={[styles.card, { backgroundColor: face, borderBottomColor: lip }]}
      >
        <Text style={[styles.label, { color: colors.textOnBrand }]}>Etapa {stage.number}</Text>
        <Text style={[styles.title, { color: colors.textOnBrand }]}>{stage.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    borderBottomWidth: elevation.buttonLip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
  title: {
    ...typography.headerTitle,
    flexShrink: 0,
  },
});
