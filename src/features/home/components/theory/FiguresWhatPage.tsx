import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { figureById, FigureId } from '@/domain/rhythm';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

import { useFigureSound } from '../../hooks/useFigureSound';
import { FigureTile } from '../notation/FigureTile';
import { PulseHeart } from '../PulseHeart';
import { Apple } from './Apple';
import { DashedDivider } from './DashedDivider';
import { DURATION_TIP } from './definitions';
import { DurationLine } from './DurationLine';
import { RichText, TheoryHeading } from './RichText';
import { useTooltip } from './TooltipHost';

/** Las dos figuras que se comparan; la línea de la más larga ocupa todo el ancho. */
const COMPARED: readonly FigureId[] = ['half', 'quarter'];
const LONGEST_UNITS = figureById('half').units;

const QUANTITIES = [
  { label: '4 manzanas', count: 4 },
  { label: '1 manzana', count: 1 },
] as const;

const ANSWER =
  '¡Exacto! El pulso es nuestra referencia, y lo estudiaremos en el módulo de "Compases y métrica".';

/**
 * Módulo 3 · Página 1: las figuras representan duración, como los números
 * cantidad. Cierra con la pregunta "¿respecto a qué cuentan?", cuya respuesta
 * (el pulso) sale en un globo al tocar el corazón.
 */
export function FiguresWhatPage() {
  const { colors } = useTheme();
  const sound = useFigureSound();

  return (
    <View style={styles.page}>
      <TheoryHeading>¿Qué son?</TheoryHeading>
      <RichText
        segments={[
          'Son símbolos que ',
          { text: 'representan la duración', mark: 'highlight' },
          ' de las notas.',
        ]}
      />

      <DashedDivider />

      <RichText segments={['Así como los números nos ayudan a representar cantidades:']} />
      <Quantities />

      <RichText
        segments={[
          'En música, las figuras nos ayudan a representar la ',
          { text: 'duración de los sonidos', mark: 'highlight', tip: DURATION_TIP },
          ':',
        ]}
      />
      <View style={styles.rows}>
        {COMPARED.map((id) => (
          <View key={id} style={styles.row}>
            <FigureTile
              figure={id}
              space={controls.figureSpaceHero}
              active={sound.sounding === id}
              accessibilityLabel={`Escuchar ${figureById(id).name.toLowerCase()}`}
              onPressIn={() => sound.play(id)}
            />
            <Text style={[styles.colon, { color: colors.textPrimary }]}>:</Text>
            <DurationLine
              figure={id}
              fraction={figureById(id).units / LONGEST_UNITS}
              sounding={sound.sounding === id}
              take={sound.take}
            />
          </View>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Presiona las figuras para escucharlas.
      </Text>

      <DashedDivider />

      <RichText segments={['¡Genial! Pero, ¿respecto a qué cuentan? 🤔']} />
      <RichText
        segments={[
          '¿Segundos? ¿Minutos? Necesitamos una ',
          { text: 'referencia', mark: 'highlight' },
          ' para "contar" con estas figuras…',
        ]}
      />
      <AnswerHeart />
    </View>
  );
}

/**
 * "4 manzanas : 🍎🍎🍎🍎" sobre "1 manzana : 🍎", en tres columnas: los dos
 * puntos y la primera manzana de cada fila quedan uno encima del otro.
 */
function Quantities() {
  const { colors } = useTheme();
  const size = controls.appleIconSize;

  return (
    <View style={styles.quantities}>
      <View style={styles.column}>
        {QUANTITIES.map(({ label }) => (
          <View key={label} accessible accessibilityLabel={label} style={{ height: size }}>
            <Text style={[styles.amount, { color: colors.textPrimary, lineHeight: size }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.column}>
        {QUANTITIES.map(({ label }) => (
          <Text
            key={label}
            style={[styles.colon, { color: colors.textPrimary, height: size, lineHeight: size }]}
          >
            :
          </Text>
        ))}
      </View>
      <View style={styles.column}>
        {QUANTITIES.map(({ label, count }) => (
          <View key={label} style={styles.apples}>
            {Array.from({ length: count }, (_, index) => (
              <Apple key={index} size={size} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const IDLE_BEAT = { count: 0, accent: false };

/**
 * El corazón del pulso (el mismo del Módulo 2), centrado. Tocarlo da un
 * latido y abre debajo, a todo el ancho, el globo con la respuesta.
 */
function AnswerHeart() {
  const tooltip = useTooltip();
  const anchor = useRef<View>(null);
  const [beat, setBeat] = useState(IDLE_BEAT);

  return (
    <View ref={anchor} collapsable={false} style={styles.heart}>
      <PulseHeart
        running={false}
        beat={beat}
        accessibilityLabel="Ver la respuesta"
        onToggle={() => {
          setBeat((current) => ({ count: current.count + 1, accent: true }));
          tooltip.toggle('pulse-answer', anchor.current, ANSWER, undefined, { wide: true });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantities: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    gap: spacing.sm,
  },
  amount: {
    ...typography.chip,
    flexShrink: 0,
  },
  colon: {
    ...typography.question,
    flexShrink: 0,
  },
  apples: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  hint: {
    ...typography.chip,
    flexShrink: 0,
    textAlign: 'center',
  },
  // El corazón trae aire arriba para sus "BUM": se sube para que no quede lejos del texto.
  heart: {
    alignSelf: 'center',
    marginTop: -spacing.xl,
  },
});
