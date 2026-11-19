import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TEMPO_START_BPM, tempoMarking } from '@/domain/lessons';
import { spacing, typography, useTheme } from '@/shared/theme';

import { usePulseLoop } from '../../hooks/usePulseLoop';
import { BpmSlider } from '../BpmSlider';
import { PulseHeart } from '../PulseHeart';
import { PulseTrace } from '../PulseTrace';
import { TEMPO_MARKING_TIP, TEMPO_TIP } from './definitions';
import { RichText, TheoryHeading } from './RichText';

/** Módulo 2 · Página 2: el tempo, cómo se mide (BPM) y cómo se llama. */
export function TempoWhatPage() {
  const { colors } = useTheme();
  const [bpm, setBpm] = useState(TEMPO_START_BPM);
  const pulse = usePulseLoop(bpm);

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué es el tempo?</TheoryHeading>
      <RichText
        segments={[
          'Es la ',
          { text: 'velocidad que tiene el pulso', mark: 'highlight' },
          ' en una canción.',
        ]}
      />
      <RichText
        segments={[
          'Así como el tiempo se mide con segundos, y la distancia con metros, el tempo ',
          { text: 'también se mide', mark: 'highlight' },
          '.',
        ]}
      />

      <TheoryHeading>BPM</TheoryHeading>
      <RichText
        segments={[
          'Significa «beats per minute», y es la ',
          { text: 'unidad de medida', mark: 'highlight' },
          ' que indica el ',
          { text: 'tempo', mark: 'highlight', tip: TEMPO_TIP },
          '.',
        ]}
      />
      <RichText segments={['Intenta cambiar el tempo un poco 😝:']} />

      <View style={styles.demo}>
        <PulseHeart
          running={pulse.running}
          beat={pulse.beat}
          disabled={!pulse.ready}
          onToggle={pulse.toggle}
        />
        <View style={styles.side}>
          <Text style={[styles.bpm, { color: colors.textPrimary }]}>BPM: {bpm}</Text>
          <PulseTrace beat={pulse.beat} />
        </View>
      </View>

      <BpmSlider bpm={bpm} onChange={setBpm} />

      {/* La indicación solo cambia al mover la barra; tocarla la explica. */}
      <View style={styles.marking}>
        <RichText
          segments={[{ text: tempoMarking(bpm), mark: 'highlight', tip: TEMPO_MARKING_TIP }]}
        />
      </View>
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
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  bpm: {
    ...typography.stat,
    flexShrink: 0,
  },
  marking: {
    alignItems: 'center',
  },
});
