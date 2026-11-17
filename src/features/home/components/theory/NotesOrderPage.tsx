import { StyleSheet, View } from 'react-native';

import { melodyClip, NOTE_COUNT, noteLetterAt, noteMidi, noteNameAt } from '@/domain/lessons';
import { spacing } from '@/shared/theme';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { OCTAVE_TIP } from './definitions';
import { RichText, TheoryHeading } from './RichText';
import { KeyBracket, WhiteKey, WhiteKeys } from './WhiteKeys';

/** DO…SI numeradas, y una octava tecla con la pregunta: ¿qué viene después? */
const ORDER_KEYS: readonly WhiteKey[] = [
  ...Array.from({ length: NOTE_COUNT }, (_, index) => ({
    midi: noteMidi(index),
    top: String(index + 1),
    main: noteLetterAt(index),
    bottom: noteNameAt(index),
  })),
  { midi: noteMidi(0, 5), main: '?' },
];

/** La respuesta: tras SI vuelve DO (la 8.ª tecla), y el teclado sigue. */
const REPEAT_KEYS: readonly WhiteKey[] = [
  ...Array.from({ length: NOTE_COUNT }, (_, index) => ({
    midi: noteMidi(index),
    main: noteLetterAt(index),
  })),
  { midi: noteMidi(0, 5), top: '8', main: noteLetterAt(0), bottom: noteNameAt(0), highlight: true },
  { midi: noteMidi(1, 5), main: noteLetterAt(1), ghost: true },
];

/** Módulo 1 · Página 2: el orden de las notas y que, al acabar, vuelven a empezar. */
export function NotesOrderPage() {
  const player = useClipPlayer();
  const play = (midi: number) => player.play(melodyClip([midi]));

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué orden siguen?</TheoryHeading>
      <RichText segments={['Las notas siempre siguen un mismo orden:']} />
      <WhiteKeys keys={ORDER_KEYS} onPlay={play} />

      <RichText
        segments={[
          '¿Y al acabar? ',
          { text: 'Pues volvemos al principio', mark: 'underline' },
          ' 😄, pero más agudo:',
        ]}
      />
      <View style={styles.figure}>
        <WhiteKeys keys={REPEAT_KEYS} onPlay={play} />
        <KeyBracket count={REPEAT_KEYS.length} from={0} to={NOTE_COUNT} />
      </View>

      <RichText
        segments={[
          'Son la misma nota, pero en diferente ',
          { text: 'octava', mark: 'underline', tip: OCTAVE_TIP },
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
