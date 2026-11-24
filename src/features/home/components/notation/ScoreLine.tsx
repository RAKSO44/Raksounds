import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import {
  figureById,
  isTied,
  itemStarts,
  itemUnits,
  RhythmItem,
  TIE_DROP,
  tieDepth,
  tiePath,
} from '@/domain/rhythm';
import { controls, useTheme } from '@/shared/theme';

import { Playhead } from '../../hooks/useBarPlayback';
import { useFigureGesture } from '../../hooks/useFigureGesture';
import { DurationBar } from './DurationBar';
import { FIGURE_FRAME, GlyphSvg, itemGlyphOf } from './FigureGlyph';
import { PlayheadLine } from './PlayheadLine';

const SPACE = controls.scoreLineSpace;
const PAD = controls.scoreLinePadding;
/** Bajo la línea cabe la ligadura más honda (y el silencio de redonda que cuelga). */
const BELOW = Math.max(FIGURE_FRAME.below, TIE_DROP + tieDepth(Infinity) + 0.3);
const LINE_Y = PAD + FIGURE_FRAME.above * SPACE;
const LINE_HEIGHT = LINE_Y + BELOW * SPACE + PAD;
/** De la cabeza a donde nace o muere la ligadura, en espacios. */
const TIE_INSET = 0.45;

interface ScoreLineProps {
  items: readonly RhythmItem[];
  /** Lo que mide la línea, en semicorcheas: cada figura ocupa su parte del ancho. */
  capacity: number;
  /** Debajo, la barra de duración: cuánto dura cada sonido y qué lo prolonga. */
  showDuration?: boolean;
  /** Mientras suena, la línea roja la recorre (si es de esta línea). */
  playhead?: Playhead | null;
  /** Tocar una figura (p. ej. para volverla silencio). Sin esto, solo se mira. */
  onPressItem?: (index: number) => void;
  /** Lo que se toca, para el lector de pantalla ("Negra. Toca para…"). */
  itemHint?: string;
  testID?: string;
}

/**
 * Una línea rítmica: la línea con sus topes y, encima, lo escrito (notas,
 * silencios, puntillos, ligaduras), cada cosa donde le toca según su
 * duración. Es la partitura mínima del Módulo 4: se arma con cualquier
 * secuencia, nada está dibujado a mano. Lo que prolonga un sonido (puntillo,
 * ligadura) va en rojo.
 */
export function ScoreLine({
  items,
  capacity,
  showDuration = false,
  playhead = null,
  onPressItem,
  itemHint,
  testID,
}: ScoreLineProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const starts = itemStarts(items);
  const unit = width / capacity;
  const headX = (index: number) => starts[index] * unit + controls.scoreLineHeadInset * SPACE;
  const totalHeight =
    LINE_HEIGHT + (showDuration ? controls.durationBarGap + controls.durationBarHeight : 0);

  return (
    <View
      testID={testID}
      style={{ height: totalHeight }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <>
          <View style={[styles.line, { top: LINE_Y, backgroundColor: colors.textPrimary }]} />
          <View style={[styles.tick, styles.start, { backgroundColor: colors.textPrimary }]} />
          <View style={[styles.tick, styles.end, { backgroundColor: colors.textPrimary }]} />

          {items.map((item, index) => {
            const glyph = itemGlyphOf(item);
            return (
              <View
                key={index}
                pointerEvents="none"
                style={[
                  styles.glyph,
                  {
                    left: headX(index) - glyph.head.x * SPACE,
                    top: LINE_Y - glyph.head.y * SPACE,
                  },
                ]}
              >
                <GlyphSvg
                  glyph={glyph}
                  space={SPACE}
                  color={colors.textPrimary}
                  markColor={colors.prolongation}
                />
              </View>
            );
          })}

          <Svg
            pointerEvents="none"
            style={styles.overlay}
            width={width}
            height={LINE_HEIGHT}
            viewBox={`0 0 ${width / SPACE} ${LINE_HEIGHT / SPACE}`}
          >
            {items.map((_, index) => {
              if (!isTied(items, index)) return null;
              const from = headX(index) / SPACE + TIE_INSET;
              const to = headX(index + 1) / SPACE - TIE_INSET;
              return (
                <Path
                  key={index}
                  d={tiePath(from, LINE_Y / SPACE + TIE_DROP, to - from)}
                  fill={colors.prolongation}
                />
              );
            })}
          </Svg>

          {onPressItem !== undefined &&
            items.map((item, index) => (
              <ItemTouch
                key={index}
                index={index}
                left={starts[index] * unit}
                width={itemUnits(item) * unit}
                label={itemLabel(item, itemHint)}
                onPress={onPressItem}
              />
            ))}

          {showDuration && (
            <View style={[styles.duration, { top: LINE_HEIGHT + controls.durationBarGap }]}>
              <DurationBar items={items} capacity={capacity} width={width} />
            </View>
          )}

          {playhead !== null && (
            <PlayheadLine playhead={playhead} width={width} height={totalHeight} />
          )}
        </>
      )}
    </View>
  );
}

/** "Silencio de negra. Toca para…" / "Blanca con puntillo". */
function itemLabel(item: RhythmItem, hint: string | undefined): string {
  const name = figureById(item.figure).name;
  const written = `${item.rest ? `Silencio de ${name.toLowerCase()}` : name}${item.dotted ? ' con puntillo' : ''}`;
  return hint === undefined ? written : `${written}. ${hint}`;
}

interface ItemTouchProps {
  index: number;
  left: number;
  width: number;
  label: string;
  onPress: (index: number) => void;
}

/** La zona tocable de una figura: todo el ancho que ocupa, de arriba abajo. */
const ItemTouch = memo(function ItemTouch({ index, left, width, label, onPress }: ItemTouchProps) {
  const { gesture } = useFigureGesture({ onPress: () => onPress(index) });
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onAccessibilityTap={() => onPress(index)}
        style={[styles.touch, { left, width }]}
      />
    </GestureDetector>
  );
});

const TICK_TOP = LINE_Y - controls.rhythmBarTickHeight / 2;

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: controls.rhythmBarStroke,
    marginTop: -controls.rhythmBarStroke / 2,
  },
  tick: {
    position: 'absolute',
    top: TICK_TOP,
    width: controls.rhythmBarStroke,
    height: controls.rhythmBarTickHeight,
  },
  start: {
    left: 0,
  },
  end: {
    right: 0,
  },
  glyph: {
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touch: {
    position: 'absolute',
    top: 0,
    height: LINE_HEIGHT,
  },
  duration: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
