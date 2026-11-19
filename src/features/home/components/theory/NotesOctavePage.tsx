import { StyleSheet, View } from 'react-native';

import { melodyClip, NOTE_COUNT, noteLetterAt, noteNameAt, runMidis } from '@/domain/lessons';
import { spacing } from '@/shared/theme';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { OCTAVE_TIP } from './definitions';
import { RichText } from './RichText';
import { KeyBracket, KeyLabels, WhiteKeys } from './WhiteKeys';

/** Diez teclas, de DO a MI de la octava siguiente. */
const KEY_COUNT = 10;
/** Las dos RE que se comparan: la 1.ª y la 8.ª contando desde la primera. */
const FIRST_RE = 1;
const SECOND_RE = FIRST_RE + NOTE_COUNT;

const KEYS = runMidis(0, KEY_COUNT).map((midi, index) => ({
  midi,
  main: noteLetterAt(index),
  // Solo la primera vuelta lleva nombre, como en el dibujo de la lección.
  bottom: index < NOTE_COUNT ? noteNameAt(index) : undefined,
  ring: index === FIRST_RE || index === SECOND_RE,
}));

/** La cuenta 1…8 bajo las teclas, de una RE a la siguiente. */
const COUNT = KEYS.map((_, index) =>
  index >= FIRST_RE && index <= SECOND_RE ? String(index - FIRST_RE + 1) : null,
);

/** Módulo 1 · Página 3: la octava como la distancia de ocho notas naturales. */
export function NotesOctavePage() {
  const player = useClipPlayer();
  const play = (midi: number) => player.play(melodyClip([midi]));

  return (
    <View style={styles.page}>
      <RichText segments={['¡No te preocupes! Más adelante entraremos en detalles.']} />
      <RichText segments={['Por ahora, recuerda que:']} />

      <View style={styles.figure}>
        <WhiteKeys keys={KEYS} onPlay={play} />
        <KeyLabels labels={COUNT} />
        <KeyBracket count={KEY_COUNT} from={FIRST_RE} to={SECOND_RE} />
      </View>

      <RichText
        segments={[
          'Para que una nota se repita, hay una ',
          { text: 'distancia', mark: 'highlight' },
          ' de ',
          { text: 'ocho', mark: 'circle' },
          ' ',
          { text: 'notas naturales', mark: 'highlight' },
          ':',
        ]}
      />
      <RichText
        segments={[
          'A esa distancia se le llama ',
          { text: 'octava', mark: 'circle', tip: OCTAVE_TIP },
          '.',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  figure: {
    gap: spacing.xs,
  },
});
