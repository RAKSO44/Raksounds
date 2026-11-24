import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { figureById, FigureId } from '@/domain/rhythm';
import { motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { FIGURE_DETAILS } from './figureDetails';
import { RichText, Segment } from './RichText';
import { useTooltip } from './TooltipHost';

/**
 * Recuadro discontinuo bajo la tabla de figuras: invita a elegir una y,
 * elegida, cuenta lo esencial de ella. Al elegir una, si el recuadro queda
 * por debajo de lo visible, la hoja baja suave hasta mostrarlo.
 */
interface FigureDetailBoxProps {
  figure: FigureId | null;
  /** Lo que se cuenta de cada una (las figuras, por defecto; o sus silencios). */
  details?: Record<FigureId, readonly (readonly Segment[])[]>;
  /** El título del detalle ("Blanca", "Silencio de blanca"). */
  titleOf?: (figure: FigureId) => string;
  /** La invitación mientras no hay ninguna elegida. */
  prompt?: string;
}

const figureName = (figure: FigureId) => figureById(figure).name;

export function FigureDetailBox({
  figure,
  details = FIGURE_DETAILS,
  titleOf = figureName,
  prompt = 'Selecciona una figura musical para ver su detalle',
}: FigureDetailBoxProps) {
  const { colors } = useTheme();
  const { reveal } = useTooltip();
  const box = useRef<View>(null);
  // Elegida una figura, el recuadro se revela al medirse ya con su texto nuevo.
  const pending = useRef(false);

  useEffect(() => {
    if (figure === null) return;
    pending.current = true;
    // Si el texto nuevo mide lo mismo no habrá onLayout: se revela igual.
    const frame = requestAnimationFrame(() => reveal(box.current));
    return () => cancelAnimationFrame(frame);
  }, [figure, reveal]);

  return (
    <View
      ref={box}
      onLayout={() => {
        if (!pending.current) return;
        pending.current = false;
        reveal(box.current);
      }}
      style={[styles.box, { borderColor: colors.border }]}
    >
      {figure === null ? (
        <View style={styles.empty}>
          <Text style={[styles.prompt, { color: colors.textSecondary }]}>{prompt}</Text>
        </View>
      ) : (
        <Animated.View
          key={figure}
          entering={FadeIn.duration(motion.enter)}
          accessibilityLiveRegion="polite"
          style={styles.detail}
        >
          <Text style={[styles.title, { color: colors.brandText }]}>{titleOf(figure)}</Text>
          {details[figure].map((segments, index) => (
            <RichText key={index} segments={segments} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  prompt: {
    ...typography.chip,
    flexShrink: 0,
    textAlign: 'center',
  },
  detail: {
    gap: spacing.sm,
  },
  title: {
    ...typography.question,
    flexShrink: 0,
  },
});
