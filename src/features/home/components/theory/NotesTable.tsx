import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { NOTE_LETTERS, NOTE_NAMES, noteClip } from '@/domain/lessons';
import { PushButton } from '@/shared/design-system';
import { radii, spacing, typography, useTheme } from '@/shared/theme';

import { useClipPlayer } from '../../hooks/useClipPlayer';
import { useTooltip } from './TooltipHost';

/** Las columnas de la tabla y lo que explica cada título al tocarlo. */
const COLUMNS = [
  { title: 'Nota', tip: 'El nombre de la nota, tal como se dice en español: DO, RE, MI…' },
  {
    title: 'Cifrado',
    tip: 'La misma nota escrita con una letra (de la A a la G). Es como se nombran en los acordes y en las canciones.',
  },
  { title: 'Sonido', tip: 'Toca el altavoz para escuchar cómo suena cada nota.' },
] as const;

/**
 * Las siete notas naturales: nombre, cifrado y un botón para oírla. La fila
 * que suena se ilumina, y cada título de columna explica qué es al tocarlo.
 */
export function NotesTable() {
  const { colors } = useTheme();
  const player = useClipPlayer();
  const [lit, setLit] = useState<number | null>(null);

  const play = (index: number) => {
    setLit(index);
    player.play(noteClip(index), { onEnd: () => setLit(null) });
  };

  return (
    <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.row, styles.headerRow, { borderBottomColor: colors.border }]}>
        {COLUMNS.map((column, index) => (
          <HeaderCell
            key={column.title}
            title={column.title}
            tip={column.tip}
            last={index === COLUMNS.length - 1}
          />
        ))}
      </View>

      {NOTE_NAMES.map((name, index) => (
        <View
          key={name}
          style={[styles.row, { backgroundColor: lit === index ? colors.brandTint : undefined }]}
        >
          <View style={[styles.cell, { borderRightColor: colors.border }]}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
          </View>
          <View style={[styles.cell, { borderRightColor: colors.border }]}>
            <Text style={[styles.name, { color: colors.brandText }]}>{NOTE_LETTERS[index]}</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <PushButton
              variant="selectable"
              tone="secondary"
              selected={lit === index}
              size="compact"
              icon="volume-high"
              accessibilityLabel={`Escuchar ${name}`}
              onPressIn={() => play(index)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function HeaderCell({ title, tip, last }: { title: string; tip: string; last: boolean }) {
  const { colors } = useTheme();
  const tooltip = useTooltip();
  const ref = useRef<View>(null);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`¿Qué es ${title.toLowerCase()}?`}
      onPress={() => tooltip.toggle(title, ref.current, tip)}
      style={[styles.cell, last ? styles.lastCell : { borderRightColor: colors.border }]}
    >
      <View ref={ref} style={styles.header}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>{title}</Text>
        <MaterialCommunityIcons name="information-outline" size={16} color={colors.brandText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 2,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRightWidth: 2,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
  name: {
    ...typography.note,
    flexShrink: 0,
  },
});
