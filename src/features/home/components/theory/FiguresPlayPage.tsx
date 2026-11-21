import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography, useTheme } from '@/shared/theme';

import { FigurePlayground } from './FigurePlayground';
import { RichText, Segment, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const NOTES: readonly ChecklistItem[] = [
  { segments: ['Puedes llenarla de muchas formas.'] },
  {
    segments: ['No puedes sobrepasar el tamaño (o duración) que definimos para nuestra barra.'],
  },
];

const INSTRUCTIONS: readonly (readonly Segment[])[] = [
  [
    { text: 'Toca', mark: 'highlight' },
    ' o ',
    { text: 'arrastra', mark: 'highlight' },
    ' las figuras para llenar la barra.',
  ],
  [{ text: 'Mantén presionadas', mark: 'highlight' }, ' las figuras en la barra para quitarlas.'],
];

/** Módulo 3 · Página 3: llenar una barra con figuras para sentir cuánto ocupa cada una. */
export function FiguresPlayPage() {
  const { colors } = useTheme();

  return (
    <View style={styles.page}>
      <TheoryHeading>¡Experimenta un poco!</TheoryHeading>
      <RichText segments={['La siguiente barra puede contener una redonda:']} />

      <FigurePlayground />

      <View style={[styles.instructions, { borderColor: colors.border }]}>
        {INSTRUCTIONS.map((segments, index) => (
          <View key={index} style={styles.instruction}>
            <Text style={[styles.bullet, { color: colors.textPrimary }]}>•</Text>
            <View style={styles.instructionText}>
              <RichText segments={segments} />
            </View>
          </View>
        ))}
      </View>

      <TheoryChecklist items={NOTES} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  instructions: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  instruction: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
  },
});
