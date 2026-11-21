import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PULSE_DEMO_BPM } from '@/domain/lessons';
import { spacing, typography, useTheme } from '@/shared/theme';

import { usePulseLoop } from '../../hooks/usePulseLoop';
import { PulseHeart } from '../PulseHeart';
import { PulseTrace } from '../PulseTrace';
import { CONSTANT_TIP } from './definitions';
import { RichText, TheoryHeading } from './RichText';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const NOTES: readonly ChecklistItem[] = [
  { segments: ['La distancia entre pulsos es igual.'] },
  { segments: ['Algunos pulsos son más fuertes que otros.'] },
];

/** Módulo 2 · Página 1: qué es el pulso, con un corazón que late. */
export function PulseWhatPage() {
  const { colors } = useTheme();
  const pulse = usePulseLoop(PULSE_DEMO_BPM);

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué es el pulso?</TheoryHeading>
      <RichText
        segments={[
          'Es una ',
          { text: 'sucesión', mark: 'highlight' },
          ' ',
          { text: 'constante', mark: 'highlight', tip: CONSTANT_TIP },
          ' ',
          { text: 'de golpes', mark: 'highlight' },
          '; y sirven para organizar la música.',
        ]}
      />
      <RichText segments={['Imagínalo como los latidos de una canción:']} />

      <View style={styles.demo}>
        <PulseHeart
          running={pulse.running}
          beat={pulse.beat}
          disabled={!pulse.ready}
          onToggle={pulse.toggle}
        />
        <View style={styles.side}>
          <PulseTrace beat={pulse.beat} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Presiona el <MaterialCommunityIcons name="heart" color={colors.heart} /> para escuchar
            el pulso.
          </Text>
        </View>
      </View>

      <RichText segments={['Nota que:']} />
      <TheoryChecklist items={NOTES} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  side: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hint: {
    ...typography.chip,
    flexShrink: 0,
  },
});
