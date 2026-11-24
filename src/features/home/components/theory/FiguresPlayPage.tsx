import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { barItems, isFull, RhythmBar } from '@/domain/rhythm';
import { PushButton } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { useBarPlayback } from '../../hooks/useBarPlayback';
import { DashedBox } from './DashedBox';
import { DashedDivider } from './DashedDivider';
import { REFERENCE_TIP } from './definitions';
import { FigurePlayground } from './FigurePlayground';
import { RichText, Segment, TheoryHeading } from './RichText';
import { TheoryBullets } from './TheoryBullets';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const INSTRUCTIONS: readonly (readonly Segment[])[] = [
  [
    { text: 'Toca', mark: 'highlight' },
    ' o ',
    { text: 'arrastra', mark: 'highlight' },
    ' las figuras para llenar la barra.',
  ],
  [{ text: 'Mantén presionadas', mark: 'highlight' }, ' las figuras en la barra para quitarlas.'],
];

const TO_REMEMBER: readonly ChecklistItem[] = [
  {
    segments: [
      'Las figuras necesitan una ',
      { text: 'referencia', mark: 'highlight', tip: REFERENCE_TIP, tipIcon: 'heart' },
      ' sobre la cual contar.',
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

/**
 * Módulo 3 · Página 4: llenar una barra con figuras y, ya llena, escucharla
 * entera sobre el pulso.
 */
export function FiguresPlayPage() {
  const { colors } = useTheme();
  const playback = useBarPlayback();
  const [bar, setBar] = useState<RhythmBar | null>(null);
  const full = bar !== null && isFull(bar);
  const playing = playback.playhead !== null;

  // Cambiar la barra (o tocar una figura) corta la reproducción: lo que sonaba ya no es la barra.
  const { stop } = playback;
  const handleChange = useCallback(
    (next: RhythmBar) => {
      setBar(next);
      stop();
    },
    [stop],
  );

  return (
    <View style={styles.page}>
      <TheoryHeading>¡Experimenta un poco!</TheoryHeading>
      <RichText
        segments={[
          'Esta barrita puede contener el tamaño de una redonda. ¡Llénala de la forma que quieras y escucha cómo suena!',
        ]}
      />

      <FigurePlayground onChange={handleChange} onSound={stop} playhead={playback.playhead} />

      <DashedBox>
        <TheoryBullets items={INSTRUCTIONS} />
      </DashedBox>

      <View style={styles.player}>
        <PushButton
          variant="solid"
          size="compact"
          icon={playing ? 'pause' : 'play'}
          accessibilityLabel={playing ? 'Detener' : 'Escuchar la barra'}
          disabled={!full || !playback.ready}
          onPress={() => {
            if (playing) stop();
            else if (bar !== null) playback.play(barItems(bar));
          }}
        />
        <Text style={[styles.playerText, { color: colors.textSecondary }]}>
          {full
            ? '¡Escucha cómo suena! Recuerda que asumimos que un pulso es una negra.'
            : 'Llena por completo la barra para escuchar cómo suena.'}
        </Text>
      </View>

      <DashedDivider />

      <RichText segments={['Para recordar:']} />
      <TheoryChecklist items={TO_REMEMBER} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerText: {
    ...typography.chip,
    flex: 1,
    flexShrink: 0,
  },
});
