import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FillBarExercise, judgeFilledBar, rhythmClip } from '@/domain/lessons';
import { figureById, FigureId, FigureSpan, isFull, lockedBar, RhythmBar } from '@/domain/rhythm';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

import { ClipPlayer } from '../../hooks/useClipPlayer';
import { ListenButton } from '../ListenButton';
import { RhythmBarView } from '../notation/RhythmBarView';
import { FigurePlayground } from '../theory/FigurePlayground';
import { RichText } from '../theory/RichText';
import { ExercisePrompt } from './ExercisePrompt';
import { ExerciseViewProps } from './types';

/**
 * Llenar una barra con figuras: la misma barra de "¡Experimenta un poco!"
 * (tocar o arrastrar para poner, mantener para quitar, vista previa al
 * acercarse). Las figuras que ya traía no se quitan. "Comprobar" se habilita
 * con la barra llena; vale cualquier forma que cumpla la regla, y si no la
 * cumple se muestra una forma correcta debajo.
 *
 * En un dictado, el ritmo se escucha con el parlante (las veces que haga
 * falta) y al fallar se muestra lo que sonó. Siempre se recuerda cuánto dura
 * la barra: sin eso no hay con qué medir lo que se pone (ni lo que se oye).
 */
export function FillBarExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<FillBarExercise>) {
  const { colors } = useTheme();
  const [figures, setFigures] = useState<readonly FigureId[]>(exercise.given);
  // La barra avisa cada cambio desde un efecto: el callback debe ser estable.
  const answer = useRef(onAnswer);
  useEffect(() => {
    answer.current = onAnswer;
  }, [onAnswer]);

  const handleChange = useCallback((bar: RhythmBar) => {
    const placed = bar.figures.map((figure) => figure.figure);
    setFigures(placed);
    answer.current(isFull(bar) ? { kind: 'bar', figures: placed } : null);
  }, []);

  const correct = judgeFilledBar(exercise, figures);
  const { rule } = exercise;
  const dictation = rule.kind === 'dictation' ? rule.figures : null;
  const lasts = exercise.capacity === figureById('whole').units;

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <ExercisePrompt exercise={exercise} />
        {lasts && (
          <View accessible accessibilityLabel="La barra dura una redonda">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <RichText segments={['La barra dura una redonda ', { figure: 'whole' }]} centered />
            </View>
          </View>
        )}
      </View>

      {dictation !== null && (
        <View style={styles.listen}>
          <ListenButton
            accessibilityLabel="El ritmo"
            disabled={!player.ready}
            onPress={() => player.play(rhythmClip(dictation))}
          />
        </View>
      )}

      <FigurePlayground
        palette={exercise.palette}
        given={exercise.given}
        disabled={revealed}
        onChange={handleChange}
      />

      {!revealed && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Toca o arrastra las figuras. Mantén presionada una para quitarla.
        </Text>
      )}

      {revealed && !correct && (
        <Animated.View entering={FadeIn.duration(motion.enter)} style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.textSecondary }]}>
            {dictation !== null ? 'Lo que sonó:' : 'Una forma correcta:'}
          </Text>
          <ExampleBar capacity={exercise.capacity} figures={exercise.example} player={player} />
        </Animated.View>
      )}
    </View>
  );
}

interface ExampleBarProps {
  capacity: number;
  figures: readonly FigureId[];
  player: ClipPlayer;
}

/** Una barra ya llena que solo se mira y se escucha (cada figura suena al tocarla). */
function ExampleBar({ capacity, figures, player }: ExampleBarProps) {
  const [width, setWidth] = useState(0);
  const [bar] = useState(() => lockedBar(capacity, figures));
  const play = useCallback((span: FigureSpan) => player.play(rhythmClip([span.figure])), [player]);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <RhythmBarView bar={bar} width={width} onPress={play} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  head: {
    gap: spacing.sm,
  },
  listen: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
  example: {
    gap: spacing.sm,
  },
  exampleLabel: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
});
