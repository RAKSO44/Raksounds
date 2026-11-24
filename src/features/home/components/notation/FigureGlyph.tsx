import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  figureById,
  FIGURES,
  FigureGlyph as Glyph,
  figureGlyph,
  FigureId,
  itemGlyph,
} from '@/domain/rhythm';

/** La geometría no cambia: se arma una vez por figura. */
const GLYPHS = new Map<FigureId, Glyph>();

export function glyphOf(id: FigureId): Glyph {
  let glyph = GLYPHS.get(id);
  if (glyph === undefined) {
    glyph = figureGlyph(figureById(id));
    GLYPHS.set(id, glyph);
  }
  return glyph;
}

/** Lo que cambia el dibujo de algo escrito (Módulo 4). */
export interface ItemLook {
  readonly figure: FigureId;
  readonly rest?: boolean;
  readonly dotted?: boolean;
}

const ITEM_GLYPHS = new Map<string, Glyph>();

/**
 * El dibujo de una figura o de su silencio, con o sin puntillo. `ledger`
 * agrega la línea corta a los silencios de redonda y blanca (donde no hay
 * otra línea en la que apoyarlos).
 */
export function itemGlyphOf({ figure, rest = false, dotted = false }: ItemLook, ledger = false) {
  if (!rest && !dotted) return glyphOf(figure);
  const key = `${figure}-${rest}-${dotted}-${ledger}`;
  let glyph = ITEM_GLYPHS.get(key);
  if (glyph === undefined) {
    glyph = itemGlyph({ figure: figureById(figure), rest, dotted }, { ledger });
    ITEM_GLYPHS.set(key, glyph);
  }
  return glyph;
}

/** Tamaño en píxeles de una figura dibujada a `space` píxeles por espacio. */
export function glyphSize(id: FigureId, space: number): { width: number; height: number } {
  const glyph = glyphOf(id);
  return { width: glyph.width * space, height: glyph.height * space };
}

/**
 * El marco común a las cinco figuras, en espacios: lo que suben sobre el
 * centro de su cabeza, lo que bajan y su ancho máximo. Dibujadas dentro de
 * este marco, todas apoyan la cabeza a la misma altura, como sobre una línea.
 */
export const FIGURE_FRAME = (() => {
  const glyphs = FIGURES.map((figure) => glyphOf(figure.id));
  return {
    above: Math.max(...glyphs.map((glyph) => glyph.head.y)),
    below: Math.max(...glyphs.map((glyph) => glyph.height - glyph.head.y)),
    width: Math.max(...glyphs.map((glyph) => glyph.width)),
  };
})();

interface FigureGlyphProps {
  figure: FigureId;
  /** Píxeles por espacio de pentagrama (la cabeza mide un espacio de alto). */
  space: number;
  color: string;
}

/**
 * Una figura musical dibujada en vectores a partir de sus propiedades (ver
 * `domain/rhythm/glyph.ts`): ningún sprite ni fuente musical. Escala sin
 * perder nitidez y se pinta de cualquier color del tema.
 */
export const FigureGlyph = memo(function FigureGlyph({ figure, space, color }: FigureGlyphProps) {
  return <GlyphSvg glyph={glyphOf(figure)} space={space} color={color} />;
});

interface GlyphSvgProps {
  glyph: Glyph;
  space: number;
  color: string;
  /** Color de lo agregado (puntillo, ligadura); el de la figura si se omite. */
  markColor?: string;
}

/** Cualquier dibujo ya construido (una figura suelta, un grupo unido por barras…). */
export function GlyphSvg({ glyph, space, color, markColor = color }: GlyphSvgProps) {
  return (
    <Svg
      width={glyph.width * space}
      height={glyph.height * space}
      viewBox={`0 0 ${glyph.width} ${glyph.height}`}
    >
      {glyph.paths.map((d, index) => (
        <Path key={`p${index}`} d={d} fill={color} fillRule="evenodd" />
      ))}
      {glyph.marks.map((d, index) => (
        <Path key={`m${index}`} d={d} fill={markColor} fillRule="evenodd" />
      ))}
    </Svg>
  );
}

/**
 * Una figura o un silencio, con o sin puntillo, dentro del marco común (como
 * `FramedFigureGlyph`): en fila, todo apoya en la misma línea invisible.
 */
export function FramedItemGlyph({
  look,
  space,
  color,
  markColor,
  ledger = true,
}: {
  look: ItemLook;
  space: number;
  color: string;
  markColor?: string;
  ledger?: boolean;
}) {
  const glyph = itemGlyphOf(look, ledger);
  const width = Math.max(FIGURE_FRAME.width, glyph.width);
  return (
    <View
      style={{
        width: width * space,
        height: (FIGURE_FRAME.above + FIGURE_FRAME.below) * space,
      }}
    >
      <View
        style={[
          styles.placed,
          {
            top: (FIGURE_FRAME.above - glyph.head.y) * space,
            left: ((width - glyph.width) / 2) * space,
          },
        ]}
      >
        <GlyphSvg glyph={glyph} space={space} color={color} markColor={markColor} />
      </View>
    </View>
  );
}

/**
 * La figura dentro del marco común (`FIGURE_FRAME`): mismo tamaño para las
 * cinco y la cabeza siempre a la misma altura. Es lo que permite ponerlas en
 * fila (paleta, tabla) y que se lean apoyadas en una línea invisible.
 */
export function FramedFigureGlyph({ figure, space, color }: FigureGlyphProps) {
  const glyph = glyphOf(figure);
  return (
    <View
      style={{
        width: FIGURE_FRAME.width * space,
        height: (FIGURE_FRAME.above + FIGURE_FRAME.below) * space,
      }}
    >
      <View
        style={[
          styles.placed,
          {
            top: (FIGURE_FRAME.above - glyph.head.y) * space,
            left: ((FIGURE_FRAME.width - glyph.width) / 2) * space,
          },
        ]}
      >
        <FigureGlyph figure={figure} space={space} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placed: {
    position: 'absolute',
  },
});
