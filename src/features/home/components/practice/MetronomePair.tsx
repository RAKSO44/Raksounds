import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/shared/theme';

import { useMetronomes } from '../../hooks/useMetronomes';
import { Metronome } from '../Metronome';

interface MetronomePairProps {
  bpms: readonly number[];
  revealed: boolean;
}

/**
 * Metrónomos lado a lado que se encienden y apagan tocándolos. Suena uno a la
 * vez: encender el otro apaga el primero, y tocar el que suena lo apaga. Su
 * BPM aparece en la placa al corregir.
 */
export function MetronomePair({ bpms, revealed }: MetronomePairProps) {
  const { colors } = useTheme();
  const metronomes = useMetronomes();

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        {bpms.map((bpm, index) => {
          const id = String(index);
          const running = metronomes.active === id;
          return (
            <Metronome
              key={id}
              size="small"
              running={running}
              bpm={bpm}
              beat={running ? metronomes.beat : IDLE}
              plate={revealed ? String(bpm) : '?'}
              weightBpm={revealed ? bpm : undefined}
              disabled={!metronomes.ready}
              accessibilityLabel={`Metrónomo ${index + 1}: ${running ? 'apagar' : 'encender'}`}
              onToggle={() => metronomes.toggle(id, bpm)}
            />
          );
        })}
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Toca un metrónomo para encenderlo o apagarlo
      </Text>
    </View>
  );
}

/** El que no suena no recibe golpes. */
const IDLE = { count: 0, accent: false };

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
