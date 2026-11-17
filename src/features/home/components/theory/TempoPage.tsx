import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { pulseClip, TEMPO_PRESETS, TempoPresetId } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { controls, radii, spacing, useTheme } from '@/shared/theme';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { PulseLight } from '../PulseLight';
import { TheoryPageLayout } from './TheoryPage';

const PRESET_LABELS: Record<TempoPresetId, string> = {
  slow: 'Lento',
  moderate: 'Moderado',
  fast: 'Rápido',
};

/** Golpes por demostración. */
const BEATS = 6;
/** Separación entre marcas a 60 BPM; a más BPM, proporcionalmente menos. */
const GAP_AT_60 = spacing.xl + spacing.md;

/** Módulo 2 · Pantalla 2: lento y rápido. */
export function TempoPage() {
  const { colors } = useTheme();
  const player = useClipPlayer();
  const [selected, setSelected] = useState<TempoPresetId>('slow');
  const [heard, setHeard] = useState<readonly TempoPresetId[]>([]);
  const [beat, setBeat] = useState(-1);
  const [pulseCount, setPulseCount] = useState(0);
  const done = heard.length >= 2;

  const bpm = TEMPO_PRESETS.find((preset) => preset.id === selected)?.bpm ?? 60;

  const play = (id: TempoPresetId, presetBpm: number) => {
    setSelected(id);
    player.play(pulseClip(presetBpm, BEATS), {
      onEvent: (index) => {
        setBeat(index);
        setPulseCount((count) => count + 1);
      },
      onEnd: () => {
        setBeat(-1);
        setHeard((previous) => (previous.includes(id) ? previous : [...previous, id]));
      },
    });
  };

  return (
    <TheoryPageLayout
      statement="El tempo es la velocidad del pulso."
      hint={done ? 'Más rápido, más pulsos por minuto' : 'Escucha al menos dos velocidades'}
      done={done}
    >
      <View style={styles.center}>
        <PulseLight pulseCount={pulseCount} />
      </View>

      {/* Mismos golpes, distinta distancia: lento = marcas separadas. */}
      <View style={[styles.marks, { gap: (GAP_AT_60 * 60) / bpm }]}>
        {Array.from({ length: BEATS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.mark,
              { backgroundColor: index === beat ? colors.brand : colors.progressTrack },
            ]}
          />
        ))}
      </View>

      <View style={styles.presets}>
        {TEMPO_PRESETS.map((preset) => (
          <PushButton
            key={preset.id}
            variant={selected === preset.id ? 'solid' : 'selectable'}
            label={PRESET_LABELS[preset.id]}
            sublabel={`${preset.bpm} BPM`}
            disabled={!player.ready}
            onPress={() => play(preset.id, preset.bpm)}
          />
        ))}
      </View>
    </TheoryPageLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  marks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mark: {
    width: controls.beatMarkSize,
    height: controls.beatMarkSize,
    borderRadius: radii.pill,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
