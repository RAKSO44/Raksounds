import { StyleSheet, View } from 'react-native';

import { Notation } from '@/domain/lessons';
import { beamedGlyph, figureById, FigureId } from '@/domain/rhythm';
import { spacing } from '@/shared/theme';

import { FIGURE_FRAME, FigureGlyph, glyphOf, GlyphSvg } from './FigureGlyph';

interface NotationGlyphProps {
  notation: Notation;
  /** Píxeles por espacio de pentagrama. */
  space: number;
  color: string;
  /**
   * Cada figura en el marco común (por defecto), para que varias, en una fila
   * o en botones vecinos, apoyen la cabeza a la misma altura. Sin marco, la
   * fila mide justo lo que ocupan SUS figuras y queda centrada en su caja (el
   * marco común guarda sitio para la plica más alta y los corchetes de la
   * semicorchea, y una fila de negras se veía caída). Va sin marco donde nada
   * se alinea con ella: la ficha grande y las opciones apiladas.
   */
  framed?: boolean;
}

/** Figuras escritas: sueltas en fila o unidas por barras. */
export function NotationGlyph({ notation, space, color, framed = true }: NotationGlyphProps) {
  if (notation.kind === 'beamed') {
    const glyph = beamedGlyph(figureById(notation.figure), notation.count);
    return (
      <View style={opticalShift((glyph.width / 2 - glyph.ink.x) * space)}>
        <GlyphSvg glyph={glyph} space={space} color={color} />
      </View>
    );
  }
  if (!framed && notation.figures.length === 1) {
    const glyph = glyphOf(notation.figures[0]);
    return (
      <View style={opticalShift((glyph.width / 2 - glyph.ink.x) * space)}>
        <FigureGlyph figure={notation.figures[0]} space={space} color={color} />
      </View>
    );
  }
  const frame = framed ? FIGURE_FRAME : frameOf(notation.figures);
  // Cada figura mide lo que mide (así el espacio entre ellas es parejo) y
  // baja lo justo para que todas las cabezas queden en la misma línea. Con el
  // marco común la fila mide lo mismo con cualquier figura: las opciones
  // vecinas no saltan (y no se corrige el centro óptico: se alinean entre sí).
  return (
    <View
      style={[
        styles.row,
        { height: (frame.above + frame.below) * space },
        framed ? null : opticalShift(rowShift(notation.figures, space)),
      ]}
    >
      {notation.figures.map((figure, index) => (
        <View key={index} style={{ marginTop: (frame.above - glyphOf(figure).head.y) * space }}>
          <FigureGlyph figure={figure} space={space} color={color} />
        </View>
      ))}
    </View>
  );
}

/**
 * Centro ÓPTICO en vez del de la caja (ver `FigureGlyph.ink`): se corre lo
 * que separa el centro de masa de la tinta del centro de la caja. Es una
 * traslación, así que el tamaño (y lo que lo rodea) no cambia.
 */
const opticalShift = (dx: number) => ({ transform: [{ translateX: dx }] });

/** Lo que hay que correr una fila (en píxeles) para centrarla por su tinta. */
function rowShift(figures: readonly FigureId[], space: number): number {
  let left = 0;
  let area = 0;
  let moment = 0;
  figures.forEach((figure, index) => {
    const glyph = glyphOf(figure);
    if (index > 0) left += spacing.md;
    area += glyph.ink.area;
    moment += glyph.ink.area * (left + glyph.ink.x * space);
    left += glyph.width * space;
  });
  return left / 2 - moment / area;
}

/** Lo que suben y bajan estas figuras respecto de la línea de sus cabezas. */
function frameOf(figures: readonly FigureId[]): { above: number; below: number } {
  const glyphs = figures.map(glyphOf);
  return {
    above: Math.max(...glyphs.map((glyph) => glyph.head.y)),
    below: Math.max(...glyphs.map((glyph) => glyph.height - glyph.head.y)),
  };
}

/** Lo escrito en palabras, para el lector de pantalla. */
export function notationLabel(notation: Notation): string {
  if (notation.kind === 'beamed') {
    return `${notation.count} ${figureById(notation.figure).name.toLowerCase()}s unidas`;
  }
  return notation.figures.map((figure) => figureById(figure).name).join(', ');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
});
