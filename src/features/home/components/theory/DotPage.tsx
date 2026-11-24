import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { figureById, FigureId, noteItem, phraseGlyph } from '@/domain/rhythm';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

import { useRhythmDemos } from '../../hooks/useRhythmDemos';
import { GlyphToggle } from '../notation/GlyphToggle';
import { DashedDivider } from './DashedDivider';
import { DemoColon, DemoHint, RhythmDemo } from './RhythmDemo';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

/** La figura de la demostración y la línea donde suena (una redonda). */
const FIGURE: FigureId = 'half';
const CAPACITY = 16;
const TOGGLE_GLYPH = phraseGlyph([{ figure: figureById(FIGURE), rest: false, dotted: true }], []);

const NOTICE: readonly ChecklistItem[] = [
  {
    segments: [
      'El puntillo se puede colocar a cualquier figura musical, ',
      { text: '¡Incluso a las figuras de silencios!', mark: 'highlight' },
    ],
  },
  { segments: ['Siempre suma ', { text: 'la mitad', mark: 'highlight' }, ' de la figura.'] },
];

/**
 * Módulo 4 · Página 3: el puntillo. Un interruptor pone y quita el puntillo
 * de la blanca; la línea la muestra donde suena y la barra de duración, lo
 * que dura: lo que suma el puntillo aparece en rojo.
 */
export function DotPage() {
  const { colors } = useTheme();
  const demos = useRhythmDemos();
  const [dotted, setDotted] = useState(false);
  const items = [noteItem(FIGURE, { dotted })];
  const name = figureById(FIGURE).name.toLowerCase();

  return (
    <View style={styles.page}>
      <TheoryHeading>El puntillo</TheoryHeading>
      <RichText
        segments={[
          'Es un punto que se coloca a la derecha de la figura musical, ',
          { text: 'y le suma la mitad de lo que dura', mark: 'highlight' },
          '.',
        ]}
      />

      <RhythmDemo
        demos={demos}
        tag="dot"
        items={items}
        capacity={CAPACITY}
        label={dotted ? `la ${name} con puntillo` : `la ${name}`}
        showDuration
        header={
          <>
            <GlyphToggle
              glyph={TOGGLE_GLYPH}
              space={controls.figureSpaceInline}
              on={dotted}
              accessibilityLabel="Puntillo"
              onToggle={() => {
                demos.stop();
                setDotted((current) => !current);
              }}
            />
            <DemoColon />
            <DemoHint>Activa el puntillo y escucha la diferencia.</DemoHint>
          </>
        }
      />
      {/* Siempre ocupa su lugar: al activar el puntillo no salta nada. */}
      <View style={[styles.addition, !dotted && styles.hidden]}>
        <Text style={[styles.additionText, { color: colors.textSecondary }]}>
          <Text style={{ color: colors.prolongationText }}>+ la mitad</Text> de lo que dura la
          figura.
        </Text>
      </View>

      <DashedDivider />

      <TheoryChecklist items={NOTICE} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  addition: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
  },
  hidden: {
    opacity: 0,
  },
  additionText: {
    ...typography.chip,
    flexShrink: 0,
    textAlign: 'right',
  },
});
