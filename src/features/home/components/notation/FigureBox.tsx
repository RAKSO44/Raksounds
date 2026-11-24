import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FigureId } from '@/domain/rhythm';
import { controls, radii, ThemeColors, useTheme } from '@/shared/theme';

import { FIGURE_FRAME, GlyphSvg, ItemLook, itemGlyphOf } from './FigureGlyph';

const SPACE = controls.figureSpaceBar;
const BORDER = 2;
/** Aire entre el borde del recuadro y la cabeza, en espacios. */
const HEAD_INSET = 1.5;

/** Alto de la barra rítmica y de cada recuadro con su margen. */
export const BAR_HEIGHT = controls.rhythmBarHeight;
/** Altura de la línea: donde se apoyan las cabezas, con el marco común centrado. */
export const BAR_LINE_Y =
  (BAR_HEIGHT - (FIGURE_FRAME.above + FIGURE_FRAME.below) * SPACE) / 2 + FIGURE_FRAME.above * SPACE;

interface Tone {
  edge: string;
  tint: string;
}

function toneOf(colors: ThemeColors, figure: FigureId): Tone {
  switch (figure) {
    case 'whole':
      return {
        edge: colors.figureWholeEdge,
        tint: colors.figureWholeTint,
      };
    case 'half':
      return {
        edge: colors.figureHalfEdge,
        tint: colors.figureHalfTint,
      };
    case 'quarter':
      return {
        edge: colors.figureQuarterEdge,
        tint: colors.figureQuarterTint,
      };
    case 'eighth':
      return {
        edge: colors.figureEighthEdge,
        tint: colors.figureEighthTint,
      };
    case 'sixteenth':
      return {
        edge: colors.figureSixteenthEdge,
        tint: colors.figureSixteenthTint,
      };
  }
}

interface FigureBoxProps extends ItemLook {
  /** Ancho en píxeles: la parte de la barra que le toca por su duración. */
  width: number;
}

/** Dónde queda el dibujo dentro del recuadro (si es angosto, se centra). */
function glyphLeft(look: ItemLook, width: number): number {
  const glyph = itemGlyphOf(look);
  const inner = width - BORDER * 2;
  return Math.min(SPACE * HEAD_INSET, Math.max(0, (inner - glyph.width * SPACE) / 2));
}

/**
 * Dónde cae el centro de la cabeza, en píxeles desde el borde izquierdo del
 * recuadro: de ahí sale (o ahí llega) una ligadura.
 */
export function boxHeadX(look: ItemLook, width: number): number {
  return BORDER + glyphLeft(look, width) + itemGlyphOf(look).head.x * SPACE;
}

/**
 * Lo que ocupa una figura en la barra rítmica: un recuadro de su color, tan
 * ancho como su duración, con la cabeza sobre la línea al inicio de su
 * espacio (ahí empieza a sonar). Un silencio va en el recuadro de su figura:
 * ocupa lo mismo. Es el mismo en la barra y en la copia que
 * viaja bajo el dedo: desde que se arrastra ya se ve cuánto va a ocupar.
 */
export const FigureBox = memo(function FigureBox({
  figure,
  rest = false,
  dotted = false,
  width,
}: FigureBoxProps) {
  const { colors } = useTheme();
  const tone = toneOf(colors, figure);
  const look = { figure, rest, dotted };
  const glyph = itemGlyphOf(look);
  const left = glyphLeft(look, width);
  const top = BAR_LINE_Y - glyph.head.y * SPACE - controls.rhythmBarBoxInset - BORDER;

  return (
    <View
      style={[
        styles.box,
        {
          width,
          borderColor: tone.edge,
          backgroundColor: tone.tint,
        },
      ]}
    >
      <View style={[styles.glyph, { left, top }]}>
        <GlyphSvg
          glyph={glyph}
          space={SPACE}
          color={colors.textPrimary}
          markColor={colors.prolongation}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    height: BAR_HEIGHT - controls.rhythmBarBoxInset * 2,
    marginVertical: controls.rhythmBarBoxInset,
    borderWidth: BORDER,
    borderRadius: radii.xs,
  },
  glyph: {
    position: 'absolute',
  },
});
