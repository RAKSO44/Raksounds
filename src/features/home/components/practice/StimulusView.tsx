import { StyleSheet, Text, View } from 'react-native';

import { Clip, Notation, notationFigures, rhythmClip, Stimulus } from '@/domain/lessons';
import { figureById, FigureId } from '@/domain/rhythm';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

import { ClipPlayer } from '../../hooks/useClipPlayer';
import { ListenButton } from '../ListenButton';
import { NoteRow } from '../NoteRow';
import { NoteSteps } from '../NoteSteps';
import { NotationSlot, NotationTile } from '../notation/NotationTile';
import { MetronomePair } from './MetronomePair';

interface StimulusViewProps {
  stimulus: Stimulus;
  player: ClipPlayer;
  /** Respuesta correcta, para rellenar el hueco al corregir. */
  solution: string | null;
  revealed: boolean;
}

/**
 * Lo que suena al tocar la ficha es UNA de sus duraciones posibles: una
 * figura no dura un tiempo fijo.
 */
const DURATION_HINT = 'Recuerda que la duración es referencial';

/** Una figura sola, escrita. */
const one = (figure: FigureId): Notation => ({ kind: 'figures', figures: [figure] });

/** La altura de un clip de una sola nota (se toca como una tecla), o `null`. */
export function singleNote(clip: Clip): number | null {
  return clip.kind === 'notes' && clip.notes.length === 1 ? clip.notes[0].midi : null;
}

/**
 * Lo que va encima de la pregunta: la escala, la fila con hueco, los sonidos
 * que hay que oír o los metrónomos que se encienden y apagan. Escuchar no es requisito para responder.
 *
 * Una nota suelta se toca como una tecla: suena al instante y se puede tocar
 * junto a otras.
 */
export function StimulusView({ stimulus, player, solution, revealed }: StimulusViewProps) {
  const { colors } = useTheme();
  const listenClips =
    stimulus.kind === 'clips'
      ? stimulus.clips.map((item) => item.clip)
      : stimulus.kind === 'steps' && stimulus.listen !== null
        ? [stimulus.listen]
        : [];

  const listen = (index: number) => {
    const clip = listenClips[index];
    const midi = singleNote(clip);
    if (midi !== null) {
      if (!player.ready) return;
      player.playNote(midi);
      return;
    }
    player.play(clip);
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
    case 'metronomes':
      return <MetronomePair bpms={stimulus.bpms} revealed={revealed} />;
    case 'notation': {
      const silent = stimulus.muted && !revealed;
      return (
        <View style={styles.block}>
          <NotationTile
            notation={stimulus.notation}
            space={controls.figureSpaceHero}
            onPressIn={
              silent ? undefined : () => player.play(rhythmClip(notationFigures(stimulus.notation)))
            }
          />
          {!silent && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {DURATION_HINT}
            </Text>
          )}
        </View>
      );
    }
    case 'reference': {
      const { known, hidden } = stimulus;
      return (
        <View style={styles.block}>
          <View style={styles.listenRow}>
            <Text style={[styles.listenLabel, { color: colors.textPrimary }]}>Escucha:</Text>
            <ListenButton
              accessibilityLabel="Las dos notas"
              disabled={!player.ready}
              onPress={() => player.play(rhythmClip([known, hidden]))}
            />
          </View>
          <View style={styles.pair}>
            <NotationTile
              notation={one(known)}
              space={controls.figureSpaceHero}
              accessibilityLabel={`Primera nota: ${figureById(known).name.toLowerCase()}`}
              onPressIn={() => player.play(rhythmClip([known]))}
            />
            {revealed ? (
              <NotationTile
                notation={one(hidden)}
                space={controls.figureSpaceHero}
                highlighted
                onPressIn={() => player.play(rhythmClip([hidden]))}
              />
            ) : (
              <NotationSlot accessibilityLabel="Segunda nota: la que hay que adivinar" />
            )}
          </View>
        </View>
      );
    }
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
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
  pair: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
});
