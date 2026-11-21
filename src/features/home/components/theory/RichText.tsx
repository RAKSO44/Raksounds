import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { beamedGlyph, figureById, FigureGlyph as Glyph, FigureId } from '@/domain/rhythm';
import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

import { glyphOf, GlyphSvg } from '../notation/FigureGlyph';
import { TipIcon, useTooltip } from './TooltipHost';

/**
 * Un trozo de un párrafo de teoría: texto llano o una palabra destacada.
 * - `highlight`: pintada en el color de marca (la idea que hay que quedarse).
 * - `circle`: dentro de un óvalo (el dato clave, "siete").
 * - `tip`: además se puede tocar y abre su definición. Solo entonces una
 *   palabra `highlight` va subrayada: el subrayado promete una definición.
 *   `tipIcon` cierra la definición con un ícono (el corazón del pulso).
 * - `figure` dentro de una marca: la figura va junto al texto, dentro del
 *   óvalo ("1 𝅝").
 * - `{ figure }` suelto: una figura musical en línea con el texto ("la mitad
 *   de 𝅗𝅥"), dibujada en vectores, nunca un carácter de una fuente.
 * - `{ beamed, count }`: varias figuras con corchetes escritas juntas, con
 *   sus plicas unidas por barras.
 */
export type Segment =
  | string
  | {
      readonly text: string;
      readonly mark: 'highlight' | 'circle';
      readonly tip?: string;
      readonly tipIcon?: TipIcon;
      readonly figure?: FigureId;
    }
  | { readonly figure: FigureId }
  | { readonly beamed: FigureId; readonly count: number };

interface RichTextProps {
  segments: readonly Segment[];
  /** Párrafo en negrita (cierres como "¡Asegúrate de recordarlas!"). */
  strong?: boolean;
  /** Centrado (el enunciado de un ejercicio). */
  centered?: boolean;
}

/**
 * Un párrafo con palabras destacadas. Cada palabra es su propio elemento en
 * una fila que envuelve: es lo que permite rodear una palabra con un óvalo o
 * medirla para apuntarle con la definición, cosas que un `Text` anidado no
 * puede hacer.
 */
export function RichText({ segments, strong = false, centered = false }: RichTextProps) {
  const { colors } = useTheme();
  const base = [styles.text, strong && styles.strong, { color: colors.textPrimary }];

  return (
    <View style={[styles.paragraph, centered && styles.centered]}>
      {groupSegments(segments).map((group, index) =>
        Array.isArray(group) ? (
          <InlineFigures key={index} figures={group} />
        ) : typeof group === 'string' ? (
          // Cada palabra lleva su espacio final: así el espaciado es el de la fuente.
          (group.match(/\S+\s*|\s+/g) ?? []).map((word, wordIndex) => (
            <Text key={`${index}-${wordIndex}`} style={base}>
              {word}
            </Text>
          ))
        ) : (
          <Mark key={index} {...group} />
        ),
      )}
    </View>
  );
}

type FigureSegment = Extract<Segment, { figure: FigureId } | { beamed: FigureId }>;
type MarkSegment = Extract<Segment, { text: string }>;

function isFigure(segment: Segment): segment is FigureSegment {
  return typeof segment !== 'string' && !('text' in segment);
}

/** Figuras seguidas ("𝅘𝅥𝅮 𝅘𝅥𝅮") van juntas en una sola ficha, como una palabra. */
function groupSegments(
  segments: readonly Segment[],
): (string | MarkSegment | FigureSegment[])[] {
  const groups: (string | MarkSegment | FigureSegment[])[] = [];
  segments.forEach((segment) => {
    const last = groups[groups.length - 1];
    if (!isFigure(segment)) groups.push(segment);
    else if (Array.isArray(last)) last.push(segment);
    else groups.push([segment]);
  });
  return groups;
}

interface MarkProps {
  text: string;
  mark: 'highlight' | 'circle';
  tip?: string;
  tipIcon?: TipIcon;
  figure?: FigureId;
}

function Mark({ text, mark, tip, tipIcon, figure }: MarkProps) {
  const { colors } = useTheme();
  const tooltip = useTooltip();
  const ref = useRef<View>(null);

  const word = (
    <View
      ref={ref}
      style={[
        styles.mark,
        mark === 'circle' && [
          styles.circle,
          { borderColor: colors.brand, backgroundColor: colors.brandTint },
        ],
      ]}
    >
      <Text
        style={[
          styles.text,
          styles.strong,
          mark === 'highlight' && tip !== undefined && styles.underline,
          { color: colors.brandText },
        ]}
      >
        {text}
      </Text>
      {figure !== undefined && (
        <GlyphSvg
          glyph={glyphOf(figure)}
          // Sin plica la figura es solo una cabeza: se agranda para que se lea junto al texto.
          space={controls.figureSpaceInline * (figureById(figure).stem ? 1 : STEMLESS_SCALE)}
          color={colors.brandText}
        />
      )}
    </View>
  );

  if (tip === undefined) return word;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Muestra su definición"
      onPress={() => tooltip.toggle(text, ref.current, tip, tipIcon)}
    >
      {word}
    </Pressable>
  );
}

const STEMLESS_SCALE = 1.6;

function glyphOfSegment(segment: FigureSegment): Glyph {
  return 'beamed' in segment
    ? beamedGlyph(figureById(segment.beamed), segment.count)
    : glyphOf(segment.figure);
}

function labelOf(segment: FigureSegment): string {
  return 'beamed' in segment
    ? `${segment.count} ${figureById(segment.beamed).name.toLowerCase()}s unidas`
    : figureById(segment.figure).name;
}

/**
 * Una o varias figuras dentro del texto, en una ficha de su tamaño: todas
 * apoyan la cabeza a la misma altura, como sobre una línea invisible.
 */
function InlineFigures({ figures }: { figures: readonly FigureSegment[] }) {
  const { colors } = useTheme();
  const space = controls.figureSpaceInline;
  const glyphs = figures.map(glyphOfSegment);
  const above = Math.max(...glyphs.map((glyph) => glyph.head.y));

  return (
    <View
      accessible
      accessibilityLabel={figures.map(labelOf).join(', ')}
      style={[styles.figures, { backgroundColor: colors.brandTint, borderColor: colors.brand }]}
    >
      {glyphs.map((glyph, index) => (
        <View key={index} style={{ marginTop: (above - glyph.head.y) * space }}>
          <GlyphSvg glyph={glyph} space={space} color={colors.brandText} />
        </View>
      ))}
    </View>
  );
}

/** Título de una página de teoría ("¿Qué son?"). */
export function TheoryHeading({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.heading, { color: colors.textPrimary }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
    flexShrink: 0,
  },
  strong: {
    ...typography.question,
    lineHeight: typography.body.lineHeight,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.xs,
    marginVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderRadius: radii.md,
  },
  circle: {
    borderWidth: 2,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  heading: {
    ...typography.title,
    flexShrink: 0,
  },
});
