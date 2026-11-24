import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { noteItem, RhythmItem, toggleRestAt } from '@/domain/rhythm';
import { spacing } from '@/shared/theme';

import { useRhythmDemos } from '../../hooks/useRhythmDemos';
import { DashedDivider } from './DashedDivider';
import { DemoHint, RhythmDemo } from './RhythmDemo';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

/** La línea de la demostración: cuatro negras que llenan una redonda. */
const CAPACITY = 16;
const START: readonly RhythmItem[] = Array.from({ length: 4 }, () => noteItem('quarter'));

const NOTICE: readonly ChecklistItem[] = [
  { segments: ['El pulso sigue avanzando, aunque no suene nada.'] },
  {
    segments: [
      'El silencio también ',
      { text: 'dura', mark: 'highlight' },
      ': ocupa el mismo lugar que la negra.',
    ],
  },
];

/**
 * Módulo 4 · Página 1: el silencio es una figura que representa una pausa.
 * Cuatro negras sobre la línea: tocar una la cambia por su silencio (y al
 * revés), y al escucharlas el pulso sigue aunque no suene nada.
 */
export function RestsWhatPage() {
  const demos = useRhythmDemos();
  const [items, setItems] = useState<readonly RhythmItem[]>(START);

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué es un silencio?</TheoryHeading>
      <RichText
        segments={[
          'Es una figura musical que ',
          { text: 'representa una pausa', mark: 'highlight' },
          ': un momento en el que no suena nada.',
        ]}
      />
      <RichText
        segments={[
          'Así como al hablar hacemos pausas entre las frases, la música también necesita momentos de silencio.',
        ]}
      />

      <RhythmDemo
        demos={demos}
        tag="rests"
        items={items}
        capacity={CAPACITY}
        label="las negras y los silencios"
        header={
          <DemoHint>
            Toca una negra para cambiarla por su silencio y escucha la diferencia.
          </DemoHint>
        }
        itemHint="Toca para cambiarla por su silencio"
        onPressItem={(index) => {
          // Lo que sonaba ya no es la línea: se corta.
          demos.stop();
          setItems((current) => toggleRestAt(current, index));
        }}
      />

      <DashedDivider />

      <RichText segments={['Nota que:']} />
      <TheoryChecklist items={NOTICE} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
});
