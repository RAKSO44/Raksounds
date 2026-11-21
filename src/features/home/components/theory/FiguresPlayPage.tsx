import { StyleSheet, View } from 'react-native';

import { radii, spacing, useTheme } from '@/shared/theme';

import { FigurePlayground } from './FigurePlayground';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const NOTES: readonly ChecklistItem[] = [
  { segments: ['Puedes llenarla de muchas formas.'] },
  {
    segments: ['No puedes sobrepasar el tamaño (o duración) que definimos para nuestra barra.'],
  },
];

/** Módulo 3 · Página 3: llenar una barra con figuras para sentir cuánto ocupa cada una. */
export function FiguresPlayPage() {
  const { colors } = useTheme();

  return (
    <View style={styles.page}>
      <TheoryHeading>¡Experimenta un poco!</TheoryHeading>
      <RichText
        segments={[
          'La siguiente barrita puede contener hasta ',
          { text: '1', mark: 'circle', figure: 'whole' },
          ':',
        ]}
      />

      <FigurePlayground />

      <View style={[styles.instructions, { borderColor: colors.border }]}>
        <RichText
          segments={[
            { text: 'Arrastra', mark: 'highlight' },
            ' las figuras que quieras para llenar la barra. ',
            { text: 'Mantenlas presionadas', mark: 'highlight' },
            ' para eliminarlas.',
          ]}
        />
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
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
