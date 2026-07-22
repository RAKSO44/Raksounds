import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { formatNote, formatNoteName, ScaleDegree } from '@/domain/music-theory';
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
  /** Si está en `true`, el label incluye el número de octava (C4 en vez de C). */
  showOctave?: boolean;
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
  showOctave = false,
}: ScaleDegreeButtonsProps) {
  return (
    <View style={styles.container}>
      {degrees.map((degree) => {
        const name = showOctave ? formatNote(degree.note) : formatNoteName(degree.note.name);
        return (
          <Animated.View
            // La clave lleva siempre nota + octava: cambiar la tónica remonta
            // el botón (fundido corto), pero alternar el ajuste de octava no.
            key={`${degree.degreeIndex}-${formatNote(degree.note)}`}
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
