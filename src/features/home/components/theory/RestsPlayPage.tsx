import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { barItems, isFull, RhythmBar } from '@/domain/rhythm';
import { PushButton } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { useBarPlayback } from '../../hooks/useBarPlayback';
import { DashedBox } from './DashedBox';
import { DashedDivider } from './DashedDivider';
import { FigurePlayground } from './FigurePlayground';
import { RichText, Segment, TheoryHeading } from './RichText';
import { TheoryBullets } from './TheoryBullets';
import { ChecklistItem, TheoryChecklist } from './TheoryChecklist';

const INSTRUCTIONS: readonly (readonly Segment[])[] = [
  [
    { text: 'Toca', mark: 'highlight' },
    ' o ',
    { text: 'arrastra', mark: 'highlight' },
    ' las figuras y los silencios para llenar la barra.',
  ],
  [
    'Enciende el ',
    { text: 'puntillo', mark: 'highlight' },
    ' o la ',
    { text: 'ligadura', mark: 'highlight' },
    ' y toca una figura de la barra para ponérselo o quitárselo.',
  ],
  [{ text: 'Mantén presionadas', mark: 'highlight' }, ' las figuras en la barra para quitarlas.'],
];

const TO_REMEMBER: readonly ChecklistItem[] = [
  { segments: ['Un silencio dura lo mismo que su figura, pero no suena.'] },
  { segments: ['El puntillo le suma a la figura la mitad de lo que dura.'] },
  { segments: ['La ligadura une dos notas en un solo sonido.'] },
];

/**
 * Módulo 4 · Página 5: la barra de "¡Experimenta un poco!" del Módulo 3,
 * ahora con silencios, puntillo y ligadura. Llena, se escucha entera sobre
 * el pulso.
 */
export function RestsPlayPage() {
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
          'Ahora la barrita también acepta silencios, puntillos y ligaduras. ¡Llénala de la forma que quieras y escucha cómo suena!',
        ]}
      />

      <FigurePlayground
        rests
        modifiers
        pulse
        onChange={handleChange}
        onSound={stop}
        playhead={playback.playhead}
      />

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
