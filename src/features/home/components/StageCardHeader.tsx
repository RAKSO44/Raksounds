import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown, FadeOutUp } from 'react-native-reanimated';

import { Stage } from '@/domain/lessons';
import { motion, spacing, typography } from '@/shared/theme';

interface StageCardHeaderProps {
  stage: Stage;
  /** Se llegó avanzando: el texto nuevo entra desde abajo (si no, desde arriba). */
  forward: boolean;
  color: string;
}

/**
 * Lo que dice la tarjeta de etapa ("ETAPA 2 / Comprensión de notas…"). Al
 * cambiar de etapa, el texto anterior sale y el nuevo entra, deslizándose en
 * la dirección del recorrido.
 */
export function StageCardHeader({ stage, forward, color }: StageCardHeaderProps) {
  return (
    <View style={styles.header}>
      <Animated.View
        key={stage.number}
        entering={(forward ? FadeInDown : FadeInUp).duration(motion.stageColor)}
        exiting={(forward ? FadeOutUp : FadeOutDown).duration(motion.exit)}
        style={styles.texts}
      >
        <Text style={[styles.label, { color }]}>Etapa {stage.number}</Text>
        <Text style={[styles.title, { color }]}>{stage.title}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
  },
  texts: {
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
