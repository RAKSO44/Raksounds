import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown, FadeOutUp } from 'react-native-reanimated';

import { Stage } from '@/domain/lessons';
import { motion, spacing, typography } from '@/shared/theme';

interface StageCardHeaderProps {
  stage: Stage;
  /** Se llegó avanzando: el texto nuevo entra desde abajo (si no, desde arriba). */
  forward: boolean;
  color: string;
  /**
   * Anima el cambio de etapa (el texto sale y entra). Sin esto el texto se
   * pinta tal cual: es la copia que se superpone a la tarjeta al expandirse,
   * y debe verse idéntica a ella desde el primer fotograma.
   */
  animate?: boolean;
}

/**
 * Lo que dice la tarjeta de etapa ("ETAPA 2 / Comprensión de notas…"). Es la
 * MISMA pieza en la tarjeta y en su copia que se expande a pantalla completa:
 * así, al expandirse o plegarse, el texto no salta de sitio.
 */
export function StageCardHeader({ stage, forward, color, animate = true }: StageCardHeaderProps) {
  const texts = (
    <>
      <Text style={[styles.label, { color }]}>Etapa {stage.number}</Text>
      <Text style={[styles.title, { color }]}>{stage.title}</Text>
    </>
  );
  return (
    <View style={styles.header}>
      {animate ? (
        // El texto de la etapa anterior sale y el de la nueva entra,
        // deslizándose en la dirección del recorrido.
        <Animated.View
          key={stage.number}
          entering={(forward ? FadeInDown : FadeInUp).duration(motion.stageColor)}
          exiting={(forward ? FadeOutUp : FadeOutDown).duration(motion.exit)}
          style={styles.texts}
        >
          {texts}
        </Animated.View>
      ) : (
        <View style={styles.texts}>{texts}</View>
      )}
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
