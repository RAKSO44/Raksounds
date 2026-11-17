import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { PRESS_SLOP } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, radii, spacing, typography, useTheme } from '@/shared/theme';

export interface WhiteKey {
  /** Altura que suena al tocarla; `null` si es solo dibujo. */
  readonly midi: number | null;
  /** Rótulo pequeño de arriba (el número de la nota). */
  readonly top?: string;
  /** Rótulo grande del centro (el cifrado, o "?"). */
  readonly main: string;
  /** Rótulo pequeño de abajo (el nombre: DO, RE…). */
  readonly bottom?: string;
  /** Tecla destacada, a color entero (la nota que se repite). */
  readonly highlight?: boolean;
  /** Rodea el rótulo central con un óvalo (las dos notas que se comparan). */
  readonly ring?: boolean;
  /** Tecla "fantasma" (punteada): el teclado sigue más allá. */
  readonly ghost?: boolean;
}

interface WhiteKeysProps {
  keys: readonly WhiteKey[];
  onPlay: (midi: number) => void;
}

/**
 * Teclas blancas de piano, sin las negras: la teoría del Módulo 1 solo habla
 * de las notas naturales. No es un instrumento, es un dibujo que suena: cada
 * tecla toca su nota al apoyar el dedo y se ilumina mientras se pulsa.
 */
export function WhiteKeys({ keys, onPlay }: WhiteKeysProps) {
  return (
    <View style={styles.keyboard}>
      {keys.map((key, index) => (
        <Key key={index} spec={key} onPlay={onPlay} />
      ))}
    </View>
  );
}

function Key({ spec, onPlay }: { spec: WhiteKey; onPlay: (midi: number) => void }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const { midi } = spec;

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(PRESS_SLOP)
        .enabled(midi !== null)
        .runOnJS(true)
        .onStart(() => {
          setPressed(true);
          hapticPressIn();
          if (midi !== null) onPlay(midi);
        })
        .onFinalize(() => setPressed(false)),
    [midi, onPlay],
  );

  const solid = pressed || spec.highlight === true;
  const face = pressed
    ? spec.highlight
      ? colors.brandShadow
      : colors.brand
    : spec.highlight
      ? colors.brand
      : colors.pianoWhiteKey;
  const edge = solid ? colors.brandShadow : colors.pianoWhiteKeyEdge;
  const strong = solid ? colors.textOnBrand : colors.pianoKeyText;
  const soft = solid ? colors.textOnBrand : colors.pianoKeyTextMuted;

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole={midi === null ? undefined : 'button'}
        accessibilityLabel={[spec.bottom, spec.main].filter(Boolean).join(' ')}
        style={[
          styles.key,
          spec.ghost && styles.ghost,
          { backgroundColor: face, borderColor: edge },
        ]}
      >
        <Text style={[styles.small, { color: solid ? colors.textOnBrand : colors.brandShadow }]}>
          {spec.top ?? ' '}
        </Text>
        <View style={spec.ring && [styles.ring, { borderColor: colors.brand }]}>
          <Text style={[styles.main, { color: strong }]}>{spec.main}</Text>
        </View>
        <Text style={[styles.small, { color: soft }]}>{spec.bottom ?? ' '}</Text>
      </View>
    </GestureDetector>
  );
}

interface KeyLabelsProps {
  /** Un rótulo por tecla (o `null` para dejarla sin rótulo). */
  labels: readonly (string | null)[];
}

/** Rótulos alineados bajo cada tecla (la cuenta 1…8 de la octava). */
export function KeyLabels({ labels }: KeyLabelsProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.keyboard}>
      {labels.map((label, index) => (
        <Text key={index} style={[styles.cell, { color: colors.textPrimary }]}>
          {label ?? ''}
        </Text>
      ))}
    </View>
  );
}

interface KeyBracketProps {
  /** Teclas del teclado al que acompaña. */
  count: number;
  /** Primera y última tecla que abarca la llave. */
  from: number;
  to: number;
}

/** Llave bajo el teclado que une dos teclas (de una nota a su repetición). */
export function KeyBracket({ count, from, to }: KeyBracketProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.bracket,
        {
          marginLeft: `${((from + 0.5) / count) * 100}%`,
          width: `${((to - from) / count) * 100}%`,
          borderColor: colors.brand,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: controls.theoryKeyHeight,
    borderWidth: 2,
    borderBottomWidth: controls.pianoKeyLip + 2,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  ghost: {
    borderStyle: 'dashed',
    opacity: 0.45,
  },
  small: {
    ...typography.caption,
    flexShrink: 0,
  },
  main: {
    ...typography.note,
    flexShrink: 0,
  },
  ring: {
    borderWidth: 2,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
  },
  cell: {
    ...typography.chip,
    flex: 1,
    textAlign: 'center',
  },
  bracket: {
    height: spacing.md,
    borderWidth: controls.bracketStroke,
    borderTopWidth: 0,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
});
