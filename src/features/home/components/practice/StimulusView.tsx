import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Clip, Stimulus } from '@/domain/lessons';
import { spacing, typography, useTheme } from '@/shared/theme';

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

/** La altura de un clip de una sola nota (se toca como una tecla), o `null`. */
export function singleNote(clip: Clip): number | null {
  return clip.kind === 'notes' && clip.notes.length === 1 ? clip.notes[0].midi : null;
}

/**
 * Lo que va encima de la pregunta: la escala, la fila con hueco o los sonidos
 * que hay que oír. Lleva la cuenta de qué sonidos se escucharon para no
 * habilitar la respuesta antes de tiempo.
 *
 * Una nota suelta cuenta como escuchada al TOCARLA (es una tecla: suena al
 * instante y se puede tocar junto a otras). Un clip más largo (los pulsos del
 * Módulo 2) cuenta al terminar: si el audio no arrancó, no se escuchó.
 */
export function StimulusView({ stimulus, player, solution, revealed, onHeard }: StimulusViewProps) {
  const { colors } = useTheme();
  const [heard, setHeard] = useState<readonly number[]>([]);
  const listenClips =
    stimulus.kind === 'clips'
      ? stimulus.clips.map((item) => item.clip)
      : stimulus.kind === 'steps' && stimulus.listen !== null
        ? [stimulus.listen]
        : [];

  useEffect(() => {
    if (listenClips.length > 0 && heard.length === listenClips.length) onHeard();
  }, [heard.length, listenClips.length, onHeard]);

  const markHeard = (index: number) =>
    setHeard((previous) => (previous.includes(index) ? previous : [...previous, index]));

  const listen = (index: number) => {
    const clip = listenClips[index];
    const midi = singleNote(clip);
    if (midi !== null) {
      if (!player.ready) return;
      player.playNote(midi);
      markHeard(index);
      return;
    }
    player.play(clip, { onEnd: () => markHeard(index) });
  };

  switch (stimulus.kind) {
    case 'steps': {
      const playStep = (index: number) => player.playNote(stimulus.midis[index]);
      if (stimulus.listen === null) {
        // Nota marcada: solo DO lleva nombre; al corregir, la escala entera se
        // llena y muestra todos los nombres.
        return (
          <NoteSteps
            labels={revealed ? 'all' : 'anchor'}
            lit={revealed ? stimulus.midis.map((_, index) => index) : [stimulus.highlight]}
            onPressStep={playStep}
          />
        );
      }
      // De oído: nada marcado ni con nombre hasta corregir.
      return (
        <View style={styles.block}>
          <View style={styles.listenRow}>
            <Text style={[styles.listenLabel, { color: colors.textPrimary }]}>Escucha:</Text>
            <ListenButton
              accessibilityLabel="La nota"
              disabled={!player.ready}
              onPress={() => listen(0)}
            />
          </View>
          <NoteSteps
            labels={revealed ? 'all' : 'none'}
            lit={revealed ? [stimulus.highlight] : []}
            onPressStep={playStep}
          />
        </View>
      );
    }
    case 'row':
      return (
        <NoteRow
          cells={stimulus.cells}
          filled={revealed ? solution : null}
          onPlay={player.playNote}
        />
      );
    case 'clips':
      return (
        <View style={styles.listenRow}>
          {stimulus.clips.map((item, index) => (
            <ListenButton
              key={item.name ?? item.label ?? index}
              label={item.label}
              accessibilityLabel={item.name}
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
  listenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  listenLabel: {
    ...typography.question,
    flexShrink: 0,
  },
});
