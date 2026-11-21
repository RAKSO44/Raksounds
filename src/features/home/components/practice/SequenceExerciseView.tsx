import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  dropOnSlot,
  emptySlots,
  filledSequence,
  firstSequenceError,
  LessonOption,
  notationFigures,
  placeInFirstEmpty,
  removeFromSlots,
  rhythmClip,
  SequenceExercise,
  SequenceSlots,
} from '@/domain/lessons';
import { FigureId } from '@/domain/rhythm';
import { PushButtonTone } from '@/shared/design-system';
import { radii, spacing, useTheme } from '@/shared/theme';

import { NoteTile, TileDrag, TileSlot } from '../NoteTile';
import { ExercisePrompt } from './ExercisePrompt';
import { ExerciseViewProps } from './types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Margen alrededor de un hueco que aún cuenta como "soltada encima". */
const DROP_SLOP = spacing.sm;

/** La figura de una ficha que es UNA figura dibujada. */
function figureOfTile(tile: LessonOption | undefined): FigureId | undefined {
  const notation = tile?.notation;
  if (notation === undefined) return undefined;
  const figures = notationFigures(notation);
  return figures.length === 1 ? figures[0] : undefined;
}

function contains(rect: Rect | null | undefined, x: number, y: number, slop = 0): boolean {
  return (
    rect != null &&
    x >= rect.x - slop &&
    x <= rect.x + rect.width + slop &&
    y >= rect.y - slop &&
    y <= rect.y + rect.height + slop
  );
}

/**
 * Ordenar fichas. Dos formas, las dos valen siempre:
 * - Tocar: una ficha de abajo va al primer hueco libre; una colocada vuelve
 *   abajo (accesible y a prueba de dedos).
 * - Arrastrar: la ficha viaja bajo el dedo y se suelta en un hueco (si estaba
 *   ocupado, se intercambian) o abajo, para devolverla.
 *
 * Cada ficha suena al tocarla (una figura, lo que dura). Al corregir, las bien puestas se ven en verde y
 * la primera que rompe el orden en rojo.
 */
export function SequenceExerciseView({
  exercise,
  revealed,
  player,
  onAnswer,
}: ExerciseViewProps<SequenceExercise>) {
  const { colors } = useTheme();
  const [slots, setSlots] = useState<SequenceSlots>(() => emptySlots(exercise.answer.length));
  const [dragging, setDragging] = useState<{ id: string; from: 'slots' | 'pool' } | null>(null);

  const slotViews = useRef<(View | null)[]>([]);
  const poolView = useRef<View>(null);
  const slotRects = useRef<(Rect | null)[]>([]);
  const poolRect = useRef<Rect | null>(null);

  const update = (next: SequenceSlots) => {
    setSlots(next);
    const ids = filledSequence(next);
    onAnswer(ids === null ? null : { kind: 'sequence', ids });
  };

  const tileOf = (id: string) => exercise.tiles.find((tile) => tile.id === id);
  const play = (id: string) => {
    const tile = tileOf(id);
    if (tile?.notation !== undefined) player.play(rhythmClip(notationFigures(tile.notation)));
    else if (tile?.midi !== undefined) player.playNote(tile.midi);
  };
  const narrow = exercise.tiles.some((tile) => figureOfTile(tile) !== undefined);

  // Los huecos se miden al empezar a arrastrar (no al colocarse): así valen
  // aunque la pantalla se haya desplazado desde entonces.
  const measure = () => {
    slotViews.current.forEach((view, index) =>
      view?.measureInWindow((x, y, width, height) => {
        slotRects.current[index] = { x, y, width, height };
      }),
    );
    poolView.current?.measureInWindow((x, y, width, height) => {
      poolRect.current = { x, y, width, height };
    });
  };

  const dragFor = (id: string, from: 'slots' | 'pool'): TileDrag => ({
    onStart: () => {
      measure();
      setDragging({ id, from });
    },
    onEnd: (x, y) => {
      setDragging(null);
      const target = slotRects.current.findIndex((rect) => contains(rect, x, y, DROP_SLOP));
      if (target >= 0) update(dropOnSlot(slots, id, target));
      else if (from === 'slots' && contains(poolRect.current, x, y)) {
        update(removeFromSlots(slots, id));
      }
    },
  });

  const errorAt = revealed
    ? firstSequenceError(
        exercise.answer,
        slots.map((s) => s ?? ''),
      )
    : null;
  const slotTone = (index: number): PushButtonTone => {
    if (!revealed) return 'secondary';
    if (errorAt === null || index < errorAt) return 'success';
    return index === errorAt ? 'danger' : 'secondary';
  };

  return (
    <View style={styles.container}>
      <ExercisePrompt exercise={exercise} />

      <View style={[styles.slots, dragging?.from === 'slots' && styles.onTop]}>
        {slots.map((id, index) => (
          <View
            key={`slot-${index}`}
            ref={(view) => {
              slotViews.current[index] = view;
            }}
            collapsable={false}
            style={id !== null && dragging?.id === id && styles.onTop}
          >
            {id === null ? (
              <TileSlot narrow={narrow} accessibilityLabel={`Hueco ${index + 1}`} />
            ) : (
              <NoteTile
                label={tileOf(id)?.label ?? ''}
                figure={figureOfTile(tileOf(id))}
                tone={slotTone(index)}
                selected={!revealed || slotTone(index) !== 'secondary'}
                accessibilityLabel={`Posición ${index + 1}: ${tileOf(id)?.label ?? ''}${
                  revealed ? '' : '. Toca para quitarla'
                }`}
                onPressIn={() => play(id)}
                onPress={revealed ? undefined : () => update(removeFromSlots(slots, id))}
                drag={revealed ? undefined : dragFor(id, 'slots')}
              />
            )}
          </View>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View
        ref={poolView}
        collapsable={false}
        style={[styles.pool, dragging?.from === 'pool' && styles.onTop]}
      >
        {exercise.tiles.map((tile) => {
          const used = slots.includes(tile.id);
          return (
            <NoteTile
              key={tile.id}
              label={tile.label}
              figure={figureOfTile(tile)}
              // Una ficha ya colocada deja su sitio vacío (gris) en vez de
              // desaparecer: así el resto no se mueve bajo el dedo.
              disabled={used || revealed}
              accessibilityLabel={tile.label}
              onPressIn={() => play(tile.id)}
              onPress={() => update(placeInFirstEmpty(slots, tile.id))}
              drag={used || revealed ? undefined : dragFor(tile.id, 'pool')}
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
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  // Lo que se arrastra pasa por encima de todo lo demás.
  onTop: {
    zIndex: 10,
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
