import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { figureById, noteItem, phraseGlyph, RhythmItem, setTiedAt } from '@/domain/rhythm';
import { controls, spacing } from '@/shared/theme';

import { useRhythmDemos } from '../../hooks/useRhythmDemos';
import { GlyphToggle } from '../notation/GlyphToggle';
import { DashedDivider } from './DashedDivider';
import { DemoColon, DemoHint, RhythmDemo, RhythmDemoRow } from './RhythmDemo';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

/** Todas las líneas de la hoja miden una redonda. */
const CAPACITY = 16;

/** Cuatro negras; la ligadura se pone entre la segunda y la tercera. */
const FOUR_QUARTERS: readonly RhythmItem[] = Array.from({ length: 4 }, () => noteItem('quarter'));
const TIED_INDEX = 1;
const QUARTER = { figure: figureById('quarter'), rest: false, dotted: false };
const TOGGLE_GLYPH = phraseGlyph([QUARTER, QUARTER], [true]);

/** Una blanca ligada a una corchea: una duración que ninguna figura escribe sola. */
const ONLY_WITH_TIE: readonly RhythmItem[] = [
  noteItem('half', { tied: true }),
  noteItem('eighth'),
  noteItem('eighth'),
  noteItem('quarter'),
];

/** La misma duración escrita de las dos formas. */
const SAME_SOUND: readonly { tag: string; label: string; items: readonly RhythmItem[] }[] = [
  {
    tag: 'dotted-half',
    label: 'la blanca con puntillo',
    items: [noteItem('half', { dotted: true }), noteItem('quarter')],
  },
  {
    tag: 'tied-half',
    label: 'la blanca ligada a una negra',
    items: [noteItem('half', { tied: true }), noteItem('quarter'), noteItem('quarter')],
  },
];

const NOTICE: readonly ChecklistItem[] = [
  {
    segments: [
      'La nota ligada ',
      { text: 'no se vuelve a tocar', mark: 'highlight' },
      ': solo alarga a la anterior.',
    ],
  },
  {
    segments: [
      'Con la ligadura puedes sumar ',
      { text: 'cualquier figura', mark: 'highlight' },
      ', no solo la mitad.',
    ],
  },
];

/**
 * Módulo 4 · Página 4: la ligadura. Un interruptor liga y desliga dos
 * negras (la barra de duración muestra un sonido o dos) y, debajo, para qué
 * sirve si ya existe el puntillo.
 */
export function TiePage() {
  const demos = useRhythmDemos();
  const [tied, setTied] = useState(false);
  const items = setTiedAt(FOUR_QUARTERS, TIED_INDEX, tied);

  return (
    <View style={styles.page}>
      <TheoryHeading>La ligadura</TheoryHeading>
      <RichText
        segments={['Así como el puntillo, la ligadura es otra forma de alargar una nota.']}
      />
      <RichText
        segments={[
          'Es una curva que une dos notas para que ',
          { text: 'suenen juntas', mark: 'highlight' },
          ': la segunda figura no se toca, sino que es una prolongación de la primera.',
        ]}
      />

      <RhythmDemo
        demos={demos}
        tag="tie"
        items={items}
        capacity={CAPACITY}
        label={tied ? 'las negras con la ligadura' : 'las negras sin ligadura'}
        showDuration
        header={
          <>
            <GlyphToggle
              glyph={TOGGLE_GLYPH}
              space={controls.figureSpaceInline}
              on={tied}
              accessibilityLabel="Ligadura"
              onToggle={() => {
                demos.stop();
                setTied((current) => !current);
              }}
            />
            <DemoColon />
            <DemoHint>Coloca y quita la ligadura y escucha la diferencia.</DemoHint>
          </>
        }
      />

      <DashedDivider />

      <RichText segments={['¿Y para qué la ligadura, si ya existe el puntillo? 🤔']} strong />
      <RichText
        segments={[
          'Porque hay duraciones que ',
          { text: 'ninguna figura', mark: 'highlight' },
          ' puede escribir sola, ni siquiera con puntillo. Como esta:',
        ]}
      />
      <RhythmDemo
        demos={demos}
        tag="only-with-tie"
        items={ONLY_WITH_TIE}
        capacity={CAPACITY}
        label="la blanca ligada a una corchea"
        showDuration
      />

      <RichText segments={['Y a veces, la misma duración se puede escribir de las dos formas:']} />
      <View style={styles.rows}>
        {SAME_SOUND.map(({ tag, label, items: written }) => (
          <RhythmDemoRow
            key={tag}
            demos={demos}
            tag={tag}
            items={written}
            capacity={CAPACITY}
            label={label}
          />
        ))}
      </View>
      <RichText segments={['¡Suenan exactamente igual!']} />

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
  rows: {
    gap: spacing.md,
  },
});
