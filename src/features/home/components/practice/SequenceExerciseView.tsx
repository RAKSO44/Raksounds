import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { firstSequenceError, SequenceExercise } from '@/domain/lessons';
import { PushButton, PushButtonTone } from '@/shared/design-system';
import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

import { ExerciseViewProps } from './types';

/**
 * Ordenar fichas SIN arrastrar (accesible y a prueba de dedos): tocar una
 * ficha de abajo la coloca en el primer hueco libre, y tocar una colocada la
 * devuelve. Al corregir, las fichas bien puestas se ven en verde y la primera
 * que rompe el orden en rojo.
 */
export function SequenceExerciseView({
  exercise,
  revealed,
  onAnswer,
}: ExerciseViewProps<SequenceExercise>) {
  const { colors } = useTheme();
  const [placed, setPlaced] = useState<readonly string[]>([]);

  const update = (next: readonly string[]) => {
    setPlaced(next);
    onAnswer(next.length === exercise.answer.length ? { kind: 'sequence', ids: next } : null);
  };

  const labelOf = (id: string) => exercise.tiles.find((tile) => tile.id === id)?.label ?? '';
  const errorAt = revealed ? firstSequenceError(exercise.answer, placed) : null;

  const slotTone = (index: number): PushButtonTone => {
    if (!revealed) return 'secondary';
    if (errorAt === null || index < errorAt) return 'success';
    return index === errorAt ? 'danger' : 'secondary';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.textPrimary }]}>{exercise.prompt}</Text>

      <View style={styles.slots}>
        {exercise.answer.map((_, index) => {
          const id = placed[index];
          if (id === undefined) {
            return (
              <View
                key={`slot-${index}`}
                accessibilityLabel={`Hueco ${index + 1}`}
                style={[styles.slot, styles.emptySlot, { borderColor: colors.border }]}
              />
            );
          }
          return (
            <PushButton
              key={`slot-${index}`}
              variant="selectable"
              tone={slotTone(index)}
              selected
              label={labelOf(id)}
              labelStyle={typography.note}
              minWidth={controls.noteCellSize}
              disabled={revealed && slotTone(index) === 'secondary'}
              accessibilityLabel={`Posición ${index + 1}: ${labelOf(id)}. Toca para quitarla`}
              onPress={() => {
                if (!revealed) update(placed.filter((placedId) => placedId !== id));
              }}
            />
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.pool}>
        {exercise.tiles.map((tile) => {
          const used = placed.includes(tile.id);
          return (
            <PushButton
              key={tile.id}
              variant="selectable"
              label={tile.label}
              labelStyle={typography.note}
              minWidth={controls.noteCellSize}
              // Una ficha ya colocada deja su sitio vacío (gris) en vez de
              // desaparecer: así el resto no se mueve bajo el dedo.
              disabled={used || revealed}
              accessibilityLabel={tile.label}
              onPress={() => update([...placed, tile.id])}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  prompt: {
    ...typography.question,
    textAlign: 'center',
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  slot: {
    minWidth: controls.noteCellSize,
    height: controls.noteCellSize,
    borderRadius: radii.md,
  },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  divider: {
    height: 2,
    borderRadius: radii.pill,
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
