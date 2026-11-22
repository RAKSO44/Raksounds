import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FigureId } from '@/domain/rhythm';
import { spacing } from '@/shared/theme';

import { FigureDetailBox } from './FigureDetailBox';
import { FiguresTable } from './FiguresTable';
import { RichText, TheoryHeading } from './RichText';

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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
});
