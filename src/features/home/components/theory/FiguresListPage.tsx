import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FigureId } from '@/domain/rhythm';
import { spacing } from '@/shared/theme';

import { REFERENCE_TIP } from './definitions';
import { FigureDetailBox } from './FigureDetailBox';
import { FiguresTable } from './FiguresTable';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const TO_REMEMBER: readonly ChecklistItem[] = [
  {
    segments: [
      'Las figuras necesitan una ',
      { text: 'referencia', mark: 'highlight', tip: REFERENCE_TIP, tipIcon: 'heart' },
      ' para saber qué tanto duran.',
    ],
  },
  {
    segments: [
      'Son ',
      { text: '"las letras"', mark: 'highlight' },
      ' que usaremos para aprender a leer y escribir música.',
    ],
  },
];

/** Módulo 3 · Página 2: las cinco figuras, su valor relativo y el detalle de cada una. */
export function FiguresListPage() {
  const [selected, setSelected] = useState<FigureId | null>(null);

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué figuras musicales existen?</TheoryHeading>
      <RichText
        segments={[
          'Aprenderemos las cinco figuras más usadas, empezando por la que ',
          { text: 'dura más', mark: 'highlight' },
          ' hasta la que ',
          { text: 'dura menos', mark: 'highlight' },
          '.',
        ]}
      />
      <FiguresTable
        selected={selected}
        // Tocar la figura ya elegida la deselecciona y vuelve el mensaje por defecto.
        onSelect={(figure) => setSelected((current) => (current === figure ? null : figure))}
      />
      <FigureDetailBox figure={selected} />
      <RichText segments={['Para recordar:']} />
      <TheoryChecklist items={TO_REMEMBER} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
});
