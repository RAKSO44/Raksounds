import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { clipsOfStimulus, Stimulus } from '@/domain/lessons';
import { spacing } from '@/shared/theme';

import { ClipPlayer } from '../../hooks/useClipPlayer';
import { ListenButton } from '../ListenButton';
import { NoteRow } from '../NoteRow';
import { NoteSteps } from '../NoteSteps';

interface StimulusViewProps {
  stimulus: Stimulus;
  player: ClipPlayer;
  /** Respuesta correcta, para rellenar el hueco al corregir. */
  solution: string | null;
  revealed: boolean;
  /** Se llama cuando ya se escuchó todo lo que había que escuchar. */
  onHeard: () => void;
}

/**
 * Lo que va encima de la pregunta: la escalera, la fila con hueco o los
 * sonidos que hay que oír. Lleva la cuenta de qué sonidos se escucharon para
 * no habilitar la respuesta antes de tiempo.
 */
export function StimulusView({ stimulus, player, solution, revealed, onHeard }: StimulusViewProps) {
  const [heard, setHeard] = useState<readonly number[]>([]);
  const clips = clipsOfStimulus(stimulus);

  useEffect(() => {
    if (clips.length > 0 && heard.length === clips.length) onHeard();
  }, [heard.length, clips.length, onHeard]);

  // Un sonido cuenta como escuchado al TERMINAR: si el audio no arrancó, el
  // `onEnd` nunca llega y la respuesta sigue cerrada.
  const listen = (index: number) => {
    player.play(clips[index], {
      onEnd: () =>
        setHeard((previous) => (previous.includes(index) ? previous : [...previous, index])),
    });
  };

  switch (stimulus.kind) {
    case 'steps': {
      // Con sonido, la ficha solo se enciende tras escucharla.
      const showHighlight = stimulus.clip === null || heard.length > 0;
      return (
        <View style={styles.block}>
          <NoteSteps labels="anchor" highlight={showHighlight ? stimulus.highlight : null} />
          {stimulus.clip !== null && (
            <View style={styles.center}>
              <ListenButton
                label="Escuchar"
                heard={heard.length > 0}
                disabled={!player.ready}
                onPress={() => listen(0)}
              />
            </View>
          )}
        </View>
      );
    }
    case 'row':
      return <NoteRow cells={stimulus.cells} filled={revealed ? solution : null} />;
    case 'clips':
      return (
        <View style={styles.listenRow}>
          {stimulus.clips.map((item, index) => (
            <ListenButton
              key={item.label}
              label={item.label}
              heard={heard.includes(index)}
              disabled={!player.ready}
              onPress={() => listen(index)}
            />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.lg,
  },
  center: {
    alignItems: 'center',
  },
  listenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
