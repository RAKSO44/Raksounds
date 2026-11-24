import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FigureId, noteItem, restItem, RhythmItem } from '@/domain/rhythm';
import { spacing } from '@/shared/theme';

import { useRhythmDemos } from '../../hooks/useRhythmDemos';
import { DashedDivider } from './DashedDivider';
import { FigureDetailBox } from './FigureDetailBox';
import { FiguresTable } from './FiguresTable';
import { REST_DETAILS, restName } from './restDetails';
import { RhythmDemoRow } from './RhythmDemo';
import { RichText, TheoryHeading } from './RichText';
import { TheoryChecklist } from './TheoryChecklist';

/** Tres formas de ocupar lo mismo que una blanca, que suenan distinto. */
const CAPACITY = 8;
const SAME_LENGTH: readonly { tag: string; label: string; items: readonly RhythmItem[] }[] = [
  { tag: 'half', label: 'la blanca', items: [noteItem('half')] },
  {
    tag: 'quarters',
    label: 'las dos negras',
    items: [noteItem('quarter'), noteItem('quarter')],
  },
  {
    tag: 'quarter-rest',
    label: 'la negra y el silencio de negra',
    items: [noteItem('quarter'), restItem('quarter')],
  },
];

/**
 * Módulo 4 · Página 2: cada figura tiene su silencio, que dura lo mismo. La
 * tabla de figuras con su silencio al lado y, debajo, tres formas de ocupar
 * lo mismo que suenan distinto.
 */
export function RestsListPage() {
  const [selected, setSelected] = useState<FigureId | null>(null);
  const demos = useRhythmDemos();

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué silencios existen?</TheoryHeading>
      <RichText
        segments={[
          'Cada figura musical tiene su propio silencio, que ',
          { text: 'dura exactamente lo mismo', mark: 'highlight' },
          '.',
        ]}
      />
      <FiguresTable
        rests
        selected={selected}
        // Tocar la fila ya elegida la deselecciona y vuelve el mensaje por defecto.
        onSelect={(figure) => setSelected((current) => (current === figure ? null : figure))}
      />
      <FigureDetailBox
        figure={selected}
        details={REST_DETAILS}
        titleOf={restName}
        prompt="Selecciona una figura o un silencio para ver su detalle"
      />

      <DashedDivider />

      <TheoryChecklist
        items={[
          {
            segments: [
              'Como ves, ocupar lo mismo ',
              { text: 'NO ES', mark: 'highlight' },
              ' sonar igual:',
            ],
          },
        ]}
      />
      <View style={styles.rows}>
        {SAME_LENGTH.map(({ tag, label, items }) => (
          <RhythmDemoRow
            key={tag}
            demos={demos}
            tag={tag}
            items={items}
            capacity={CAPACITY}
            label={label}
          />
        ))}
      </View>
      <RichText segments={['Todas duran 2 pulsos, pero suenan diferentes.']} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  rows: {
    gap: spacing.md,
  },
});
