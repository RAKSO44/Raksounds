import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { formatNote, ScaleDegree } from '@/domain/music-theory';
import { PushButton } from '@/shared/design-system';
import { spacing, typography } from '@/shared/theme';

interface ScaleDegreeButtonsProps {
  degrees: readonly ScaleDegree[];
  /** El dedo toca la tecla. La nota debe empezar aquí, no al soltar. */
  onPressDegree: (degree: ScaleDegree) => void;
  /** El dedo suelta la tecla (o el gesto se cancela). */
  onReleaseDegree: (degree: ScaleDegree) => void;
  /** Deshabilita los botones mientras cargan las muestras de audio. */
  disabled?: boolean;
}

/**
 * Cada grado de la escala/arpegio como botón sólido que suena al presionarlo.
 *
 * Se comportan como teclas de piano: suenan al TOCARLAS (no al soltarlas),
 * siguen sonando mientras el dedo aguanta y se pueden pulsar varias a la vez.
 */
export function ScaleDegreeButtons({
  degrees,
  onPressDegree,
  onReleaseDegree,
  disabled,
}: ScaleDegreeButtonsProps) {
  return (
    <View style={styles.container}>
      {degrees.map((degree) => {
        const name = formatNote(degree.note);
        return (
          <Animated.View
            // Incluir el nombre en la clave hace que cambiar la tónica remonte
            // el botón y dispare un fundido corto y discreto.
            key={`${degree.degreeIndex}-${name}`}
            entering={FadeIn.duration(120)}
            layout={LinearTransition.duration(160)}
          >
            <PushButton
              variant="solid"
              label={name}
              sublabel={String(degree.degreeIndex + 1)}
              labelStyle={typography.note}
              accessibilityLabel={`Nota ${name}`}
              disabled={disabled}
              onPressIn={() => onPressDegree(degree)}
              onPressOut={() => onReleaseDegree(degree)}
              minWidth={64}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
