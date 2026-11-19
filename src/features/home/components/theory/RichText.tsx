import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography, useTheme } from '@/shared/theme';

import { useTooltip } from './TooltipHost';

/**
 * Un trozo de un párrafo de teoría: texto llano o una palabra destacada.
 * - `highlight`: pintada en el color de marca (la idea que hay que quedarse).
 * - `circle`: dentro de un óvalo (el dato clave, "siete").
 * - `tip`: además se puede tocar y abre su definición. Solo entonces una
 *   palabra `highlight` va subrayada: el subrayado promete una definición.
 */
export type Segment =
  string | { readonly text: string; readonly mark: 'highlight' | 'circle'; readonly tip?: string };

interface RichTextProps {
  segments: readonly Segment[];
  /** Párrafo en negrita (cierres como "¡Asegúrate de recordarlas!"). */
  strong?: boolean;
}

/**
 * Un párrafo con palabras destacadas. Cada palabra es su propio elemento en
 * una fila que envuelve: es lo que permite rodear una palabra con un óvalo o
 * medirla para apuntarle con la definición, cosas que un `Text` anidado no
 * puede hacer.
 */
export function RichText({ segments, strong = false }: RichTextProps) {
  const { colors } = useTheme();
  const base = [styles.text, strong && styles.strong, { color: colors.textPrimary }];

  return (
    <View style={styles.paragraph}>
      {segments.flatMap((segment, index) =>
        typeof segment === 'string' ? (
          // Cada palabra lleva su espacio final: así el espaciado es el de la fuente.
          (segment.match(/\S+\s*|\s+/g) ?? []).map((word, wordIndex) => (
            <Text key={`${index}-${wordIndex}`} style={base}>
              {word}
            </Text>
          ))
        ) : (
          <Mark key={index} text={segment.text} mark={segment.mark} tip={segment.tip} />
        ),
      )}
    </View>
  );
}

function Mark({ text, mark, tip }: { text: string; mark: 'highlight' | 'circle'; tip?: string }) {
  const { colors } = useTheme();
  const tooltip = useTooltip();
  const ref = useRef<View>(null);

  const word = (
    <View
      ref={ref}
      style={
        mark === 'circle' && [
          styles.circle,
          { borderColor: colors.brand, backgroundColor: colors.brandTint },
        ]
      }
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
    </View>
  );

  if (tip === undefined) return word;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Muestra su definición"
      onPress={() => tooltip.toggle(text, ref.current, tip)}
    >
      {word}
    </Pressable>
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
