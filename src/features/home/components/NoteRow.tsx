import { StyleSheet, View } from 'react-native';

import { RowCell } from '@/domain/lessons';
import { spacing } from '@/shared/theme';

import { NoteTile, TileSlot } from './NoteTile';

interface NoteRowProps {
  cells: readonly RowCell[];
  /** Lo que se muestra en el hueco al corregir; `null` = aún sin corregir. */
  filled: string | null;
  /** Hace sonar una nota de la fila. */
  onPlay: (midi: number) => void;
}

/**
 * Una fila de notas con un hueco ("DO · RE · ? · FA"). Cada nota se puede
 * tocar y suena; el hueco, con borde de acento, no suena hasta corregir (sería
 * dar la respuesta). Al corregir se rellena y ya suena como las demás.
 */
export function NoteRow({ cells, filled, onPlay }: NoteRowProps) {
  return (
    <View style={styles.row}>
      {cells.map((cell, index) => {
        const isGap = cell.label === null;
        if (isGap && filled === null) {
          return <TileSlot key={index} label="?" accessibilityLabel="Hueco" />;
        }
        const label = cell.label ?? filled ?? '';
        return (
          <NoteTile
            key={index}
            label={label}
            selected={isGap}
            accessibilityLabel={`Nota ${label}`}
            onPressIn={() => onPlay(cell.midi)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
