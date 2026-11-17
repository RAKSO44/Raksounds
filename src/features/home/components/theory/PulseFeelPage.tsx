import { StyleSheet, View } from 'react-native';

import { PushButton } from '@/shared/design-system';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { useTapRun } from '../../hooks/useTapRun';
import { BeatMarks } from '../BeatMarks';
import { PulseLight } from '../PulseLight';
import { TapPad } from '../TapPad';
import { TheoryPageLayout } from './TheoryPage';

/** La demostración: 4 golpes de entrada y 6 para tocar, a 80 BPM. */
const DEMO = { bpm: 80, countIn: 4, beats: 6 } as const;

/** Módulo 2 · Pantalla 1: siente el pulso. */
export function PulseFeelPage() {
  const player = useClipPlayer();
  const run = useTapRun(player, DEMO);
  const done = run.judgement !== null;

  const feedback = run.judgement
    ? run.judgement.passed
      ? `¡Muy bien! Seguiste ${run.judgement.hits} de ${DEMO.beats} pulsos.`
      : `Seguiste ${run.judgement.hits} de ${DEMO.beats}. ¡Prueba otra vez!`
    : run.phase === 'running'
      ? 'Toca siguiendo el pulso'
      : 'Pulsa «Escuchar pulso» y toca TAP con cada golpe';

  return (
    <TheoryPageLayout
      statement="El pulso es un golpe regular que podemos seguir."
      hint={feedback}
      done={done}
    >
      <View style={styles.center}>
        <PulseLight pulseCount={run.pulseCount} />
      </View>
      <BeatMarks
        countIn={DEMO.countIn}
        beats={DEMO.beats}
        active={run.beat}
        grades={run.judgement?.beats.map((beat) => beat.grade)}
      />
      <TapPad disabled={run.phase !== 'running'} onTap={run.tap} />
      <View style={styles.center}>
        <PushButton
          variant="selectable"
          tone="secondary"
          icon={run.phase === 'idle' ? 'metronome' : 'replay'}
          iconPlacement="start"
          label={run.phase === 'idle' ? 'Escuchar pulso' : 'Otra vez'}
          disabled={!player.ready || run.phase === 'running'}
          onPress={run.start}
        />
      </View>
    </TheoryPageLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
});
