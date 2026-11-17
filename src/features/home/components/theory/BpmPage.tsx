import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BPM_RANGE,
  BPM_STEP,
  clampBpm,
  pulseClip,
  pulsesPerSecond,
  TEMPO_PRESETS,
} from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { radii, spacing, typography, useTheme } from '@/shared/theme';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { PulseLight } from '../PulseLight';
import { TheoryPageLayout } from './TheoryPage';

/** Golpes por escucha. */
const BEATS = 8;

/** "1", "1,5", "0,67": decimales a la española y sin ceros de sobra. */
function formatPerSecond(bpm: number): string {
  return String(Math.round(pulsesPerSecond(bpm) * 100) / 100).replace('.', ',');
}

/** Módulo 2 · Pantalla 3: BPM. */
export function BpmPage() {
  const { colors } = useTheme();
  const player = useClipPlayer();
  const [bpm, setBpm] = useState(60);
  const [heard, setHeard] = useState<readonly number[]>([]);
  const [pulseCount, setPulseCount] = useState(0);
  const done = heard.length >= 2;

  const change = (next: number) => {
    // Cambiar el tempo corta lo que suena: si no, el pulso viejo seguiría.
    player.stop();
    setBpm(clampBpm(next));
  };

  const listen = () => {
    player.play(pulseClip(bpm, BEATS), {
      onEvent: () => setPulseCount((count) => count + 1),
      onEnd: () => setHeard((previous) => (previous.includes(bpm) ? previous : [...previous, bpm])),
    });
  };

  const perSecond = formatPerSecond(bpm);

  return (
    <TheoryPageLayout
      statement="BPM significa pulsos por minuto."
      hint={done ? '¿Notas la diferencia?' : 'Cambia los BPM y escucha'}
      done={done}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <PulseLight pulseCount={pulseCount} />
        <View style={styles.counter}>
          <PushButton
            variant="selectable"
            icon="minus"
            accessibilityLabel="Menos BPM"
            disabled={bpm <= BPM_RANGE.min}
            onPress={() => change(bpm - BPM_STEP)}
          />
          <View style={styles.value}>
            <Text style={[styles.bpm, { color: colors.textPrimary }]}>{bpm}</Text>
            <Text style={[styles.unit, { color: colors.textSecondary }]}>BPM</Text>
          </View>
          <PushButton
            variant="selectable"
            icon="plus"
            accessibilityLabel="Más BPM"
            disabled={bpm >= BPM_RANGE.max}
            onPress={() => change(bpm + BPM_STEP)}
          />
        </View>
        <Text style={[styles.fact, { color: colors.textSecondary }]}>
          {bpm} BPM = {perSecond} {perSecond === '1' ? 'pulso' : 'pulsos'} por segundo
        </Text>
      </View>

      <View style={styles.row}>
        {TEMPO_PRESETS.map((preset) => (
          <PushButton
            key={preset.id}
            variant={bpm === preset.bpm ? 'solid' : 'selectable'}
            label={`${preset.bpm}`}
            onPress={() => change(preset.bpm)}
          />
        ))}
        <PushButton
          variant="solid"
          tone="secondary"
          icon="play"
          iconPlacement="start"
          label="Escuchar"
          disabled={!player.ready}
          onPress={listen}
        />
      </View>

      <Text style={[styles.fact, { color: colors.brandText }]}>60 BPM = 1 pulso por segundo</Text>
    </TheoryPageLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  value: {
    alignItems: 'center',
  },
  bpm: {
    ...typography.heroValue,
  },
  unit: {
    ...typography.sectionLabel,
  },
  fact: {
    ...typography.chip,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
