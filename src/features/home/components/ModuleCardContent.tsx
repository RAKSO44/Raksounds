import { StyleSheet, Text, View } from 'react-native';

import { PathModule } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

interface ModuleCardContentProps {
  module: PathModule;
  theoryDone: boolean;
  practiceDone: boolean;
  onTheory: () => void;
  onPractice: () => void;
}

/**
 * El interior de un módulo abierto: su temario a la izquierda y, a la derecha,
 * sus dos entradas (Teoría y Práctica), cada una dorada cuando ya se hizo.
 * Nada bloquea: las dos se pueden abrir siempre, en cualquier orden.
 */
export function ModuleCardContent({
  module,
  theoryDone,
  practiceDone,
  onTheory,
  onPractice,
}: ModuleCardContentProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={[styles.number, { color: colors.brandText }]}>Módulo {module.number}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{module.title}</Text>
        {module.topics.map((topic) => (
          <View key={topic} style={styles.topic}>
            <Text style={[styles.topicText, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.topicText, styles.topicLabel, { color: colors.textSecondary }]}>
              {topic}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <PushButton
          variant="solid"
          tone={theoryDone ? 'warning' : 'brand'}
          icon="book-open-variant"
          fillHeight
          accessibilityLabel={theoryDone ? 'Teoría (leída)' : 'Teoría'}
          style={styles.action}
          onPress={onTheory}
        />
        <PushButton
          variant="solid"
          tone={practiceDone ? 'warning' : 'brand'}
          icon="play"
          fillHeight
          accessibilityLabel={practiceDone ? 'Ejercicios (completados)' : 'Ejercicios'}
          style={styles.action}
          onPress={onPractice}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  texts: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  number: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
  title: {
    ...typography.question,
    flexShrink: 0,
  },
  topic: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topicText: {
    ...typography.subtitle,
  },
  topicLabel: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  action: {
    alignSelf: 'stretch',
    width: controls.moduleCardButtonWidth,
  },
});
