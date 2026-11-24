import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RhythmItem } from '@/domain/rhythm';
import { PushButton } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { RhythmDemos } from '../../hooks/useRhythmDemos';
import { ScoreLine } from '../notation/ScoreLine';

interface PlayButtonProps {
  demos: RhythmDemos;
  tag: string;
  items: readonly RhythmItem[];
  capacity: number;
  /** Lo que suena, para el lector de pantalla ("Escuchar la blanca con puntillo"). */
  label: string;
}

/**
 * Reproducir/pausar una línea rítmica: morado, y pausar la corta en seco
 * (al volver a reproducir arranca desde el principio).
 */
export function RhythmPlayButton({ demos, tag, items, capacity, label }: PlayButtonProps) {
  const playing = demos.isPlaying(tag);
  return (
    <PushButton
      variant="solid"
      size="compact"
      icon={playing ? 'pause' : 'play'}
      accessibilityLabel={playing ? 'Detener' : `Escuchar ${label}`}
      disabled={!demos.ready}
      onPress={() => demos.toggle(tag, items, capacity)}
    />
  );
}

interface RhythmDemoProps extends PlayButtonProps {
  /** Lo que va a la derecha del botón (un interruptor, la instrucción…). */
  header?: ReactNode;
  /** Con la barra de duración debajo de la línea. */
  showDuration?: boolean;
  onPressItem?: (index: number) => void;
  itemHint?: string;
}

/**
 * Una demostración de la teoría: arriba el botón de reproducir (con lo que
 * se quiera a su lado) y debajo la línea rítmica entera con lo escrito, que
 * la línea roja recorre mientras suena.
 */
export function RhythmDemo({
  header,
  showDuration = false,
  onPressItem,
  itemHint,
  ...play
}: RhythmDemoProps) {
  return (
    <View style={styles.demo}>
      <View style={styles.header}>
        <RhythmPlayButton {...play} />
        {header}
      </View>
      <ScoreLine
        items={play.items}
        capacity={play.capacity}
        showDuration={showDuration}
        playhead={play.demos.playheadOf(play.tag)}
        onPressItem={onPressItem}
        itemHint={itemHint}
        testID={`score-${play.tag}`}
      />
    </View>
  );
}

/** Reproducir a la izquierda y la línea rítmica a la derecha, en una fila. */
export function RhythmDemoRow(props: PlayButtonProps) {
  return (
    <View style={styles.row}>
      <RhythmPlayButton {...props} />
      <View style={styles.line}>
        <ScoreLine
          items={props.items}
          capacity={props.capacity}
          playhead={props.demos.playheadOf(props.tag)}
          testID={`score-${props.tag}`}
        />
      </View>
    </View>
  );
}

/** El texto al lado del botón ("Toca una negra para…"). */
export function DemoHint({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.hint, { color: colors.textSecondary }]}>{children}</Text>;
}

/** Los dos puntos entre un interruptor y su instrucción, como en "𝅗𝅥 : …". */
export function DemoColon() {
  const { colors } = useTheme();
  return <Text style={[styles.colon, { color: colors.textPrimary }]}>:</Text>;
}

const styles = StyleSheet.create({
  demo: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: {
    flex: 1,
  },
  hint: {
    ...typography.chip,
    flex: 1,
    flexShrink: 0,
  },
  colon: {
    ...typography.question,
    flexShrink: 0,
  },
});
