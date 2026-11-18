import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';

import { NotesTable } from './NotesTable';
import { RichText, TheoryHeading } from './RichText';

/** Módulo 1 · Página 1: qué son las notas y cuáles son las siete naturales. */
export function NotesWhatPage() {
  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué son?</TheoryHeading>
      <RichText
        segments={[
          'Son los ',
          { text: 'bloques de construcción básicos', mark: 'highlight' },
          ' de la música.',
        ]}
      />
      <RichText
        segments={[
          'En el sistema occidental, existen ',
          { text: 'siete', mark: 'circle' },
          ' notas naturales:',
        ]}
      />
      <NotesTable />
      <RichText strong segments={['¡Asegúrate de recordarlas!']} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
});
