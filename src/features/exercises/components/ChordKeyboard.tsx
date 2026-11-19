import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { buildKeyboard, KeyboardKey, keyboardRangeFor } from '@/domain/music-theory';
import { ChordSingingExercise, chordSymbol } from '@/domain/singing';
import { PianoKeyBody, PushButton } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { CHORD_FUNCTION_LABELS } from '../labels';
import { useNoteFormatter } from '../hooks/useNoteFormatter';
import { NotePlayer } from '../hooks/useNotePlayer';

/**
 * Teclas blancas que muestra siempre el teclado. Un acorde en posición cerrada
 * abarca como mucho 7 blancas, más una libre a cada lado: con 10 todos los
 * acordes caben y el teclado no cambia de tamaño de un ejercicio a otro.
 */
const MIN_WHITE_KEYS = 10;

/** Mismo margen de arrastre que `PushButton`: más allá, el gesto se cancela. */
const PRESS_SLOP = 20;

type KeyRole = 'off' | 'chord' | 'target';

interface ChordKeyboardProps {
  exercise: ChordSingingExercise;
  player: NotePlayer;
}

/**
 * Corrección de la entonación de notas: un teclado dibujado en la app con las
 * notas que sonaron coloreadas y una flecha bajo la que había que cantar.
 *
 * Solo las teclas del acorde se pueden tocar (cada una suena sola, para oír
 * por separado lo que antes sonó junto); el resto es contexto. Debajo, una
 * tecla con el nombre del acorde lo hace sonar entero.
 *
 * Entra en tres tiempos cortos: el teclado se funde, las teclas del acorde se
 * colorean una tras otra de grave a agudo, y la flecha sube a su sitio.
 */
export function ChordKeyboard({ exercise, player }: ChordKeyboardProps) {
  const { colors } = useTheme();
  const format = useNoteFormatter();
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  // Hasta medir el contenedor se estima con el ancho de la ventana menos los
  // márgenes de la pantalla: así el teclado sale en el primer fotograma, sin
  // un hueco que luego "salta".
  const available = measured > 0 ? measured : windowWidth - 2 * spacing.md;
  const [captionWidth, setCaptionWidth] = useState(0);

  const layout = useMemo(() => {
    const { low, high } = keyboardRangeFor(
      exercise.tones.map((tone) => tone.midi),
      MIN_WHITE_KEYS,
    );
    return buildKeyboard(low, high);
  }, [exercise.tones]);

  const unit = Math.min(available / layout.whiteKeyCount, controls.pianoWhiteKeyMaxWidth);
  const totalWidth = unit * layout.whiteKeyCount;

  const roleOf = (midi: number): KeyRole => {
    if (midi === exercise.targetMidi) return 'target';
    return exercise.tones.some((tone) => tone.midi === midi) ? 'chord' : 'off';
  };
  // Orden de grave a agudo entre las notas del acorde, para escalonar el color.
  const orderOf = (midi: number) => exercise.tones.findIndex((tone) => tone.midi === midi);

  const targetKey = layout.keys.find((key) => key.midi === exercise.targetMidi);
  const targetCenter = targetKey === undefined ? 0 : (targetKey.left + targetKey.width / 2) * unit;
  const captionLeft = Math.max(
    0,
    Math.min(totalWidth - captionWidth, targetCenter - captionWidth / 2),
  );
  const arrowDelay = motion.enter + exercise.tones.length * motion.stagger;

  const symbol = chordSymbol(exercise);
  const midis = exercise.tones.map((tone) => tone.midi);

  return (
    <Animated.View entering={FadeIn.duration(motion.enter)} style={styles.container}>
      <View
        style={styles.measure}
        onLayout={(event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width)}
      >
        {available > 0 && (
          <View style={{ width: totalWidth }}>
            <View
              style={[
                styles.keyboard,
                { width: totalWidth, backgroundColor: colors.pianoWhiteKeyEdge },
              ]}
            >
              {layout.keys.map((key) => {
                const tone = exercise.tones.find((candidate) => candidate.midi === key.midi);
                return (
                  <PianoKey
                    key={key.midi}
                    pianoKey={key}
                    unit={unit}
                    role={roleOf(key.midi)}
                    order={orderOf(key.midi)}
                    disabled={!player.ready}
                    accessibilityLabel={
                      tone === undefined
                        ? undefined
                        : `${CHORD_FUNCTION_LABELS[tone.fn]}: ${format(tone.note)}`
                    }
                    onPressIn={() => player.press(`tone-${key.midi}`, key.midi)}
                    onPressOut={() => player.release(`tone-${key.midi}`)}
                  />
                );
              })}
            </View>

            {targetKey !== undefined && (
              <Animated.View
                entering={FadeInUp.delay(arrowDelay).duration(motion.enter)}
                style={styles.pointer}
              >
                <MaterialCommunityIcons
                  name="arrow-up-bold"
                  size={controls.pianoArrowSize}
                  color={colors.secondary}
                  style={[styles.arrow, { left: targetCenter - controls.pianoArrowSize / 2 }]}
                />
                <Text
                  onLayout={(event) => setCaptionWidth(event.nativeEvent.layout.width)}
                  style={[styles.caption, { color: colors.secondaryText, left: captionLeft }]}
                >
                  Era esta: {format(exercise.target)}
                </Text>
              </Animated.View>
            )}
          </View>
        )}
      </View>

      <PushButton
        variant="solid"
        label={symbol}
        labelStyle={typography.noteLarge}
        minWidth={controls.noteTileSize}
        // `PushButton` se alinea al inicio por defecto; esta tecla va centrada
        // sobre la consigna y crece con el cifrado (`C/E♭` es más ancho que `C`).
        style={styles.chordButton}
        disabled={!player.ready}
        accessibilityLabel={`Escuchar el acorde completo: ${symbol}`}
        onPressIn={() => player.pressChord('chord', midis)}
        onPressOut={() => player.release('chord')}
      />
    </Animated.View>
  );
}

interface PianoKeyProps {
  pianoKey: KeyboardKey;
  /** Píxeles de una tecla blanca. */
  unit: number;
  role: KeyRole;
  /** Posición entre las notas del acorde (para escalonar su color); -1 si no es del acorde. */
  order: number;
  disabled: boolean;
  accessibilityLabel?: string;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Una tecla. Las del acorde tienen el mismo relieve que un `PushButton`: cara
 * sobre un labio que se colapsa al pulsar (snap instantáneo) con un golpe
 * háptico. Las demás no tienen gesto: solo dibujan el piano.
 */
function PianoKey({
  pianoKey,
  unit,
  role,
  order,
  disabled,
  accessibilityLabel,
  onPressIn,
  onPressOut,
}: PianoKeyProps) {
  const { colors } = useTheme();
  const interactive = role !== 'off';
  const pressOffset = useSharedValue(0);
  const tint = useSharedValue(0);

  useEffect(() => {
    if (!interactive) return;
    tint.value = withDelay(
      motion.enter + Math.max(0, order) * motion.stagger,
      withTiming(1, { duration: motion.enter, easing: Easing.out(Easing.cubic) }),
    );
  }, [interactive, order, tint]);

  const handlePressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    pressOffset.value = controls.pianoKeyLip;
    hapticPressIn();
    onPressIn();
  }, [pressOffset, onPressIn]);

  const handlePressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- ídem
    pressOffset.value = 0;
    onPressOut();
  }, [pressOffset, onPressOut]);

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(PRESS_SLOP)
        .enabled(interactive && !disabled)
        .runOnJS(true)
        .onStart(handlePressIn)
        .onFinalize(handlePressOut),
    [interactive, disabled, handlePressIn, handlePressOut],
  );

  const tintStyle = useAnimatedStyle(() => ({ opacity: tint.value }));

  const black = pianoKey.black;
  const height = black ? controls.pianoHeight * controls.pianoBlackKeyRatio : controls.pianoHeight;
  const baseFace = black ? colors.pianoBlackKey : colors.pianoWhiteKey;
  const baseLip = black ? colors.pianoBlackKeyEdge : colors.pianoWhiteKeyEdge;
  const highlightFace = role === 'target' ? colors.secondary : colors.brand;
  const highlightLip = role === 'target' ? colors.secondaryShadow : colors.brandShadow;

  const key = (
    <View
      accessible={interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={interactive ? { disabled } : undefined}
      onAccessibilityTap={() => {
        if (!interactive || disabled) return;
        onPressIn();
        onPressOut();
      }}
      style={[
        styles.key,
        black ? styles.blackKey : styles.whiteKey,
        { left: pianoKey.left * unit, width: pianoKey.width * unit, height },
      ]}
    >
      <PianoKeyBody
        pressOffset={pressOffset}
        face={baseFace}
        lip={baseLip}
        lipOverlay={
          interactive && (
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: highlightLip }, tintStyle]}
            />
          )
        }
      >
        {interactive && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: highlightFace }, tintStyle]}
          />
        )}
      </PianoKeyBody>
    </View>
  );

  return interactive ? <GestureDetector gesture={gesture}>{key}</GestureDetector> : key;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  measure: {
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: controls.pianoHeight,
  },
  keyboard: {
    height: controls.pianoHeight,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  key: {
    position: 'absolute',
    top: 0,
  },
  whiteKey: {
    // Ranura entre teclas: deja ver el fondo del teclado como línea divisoria.
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  blackKey: {
    zIndex: 1,
  },
  pointer: {
    height: controls.pianoArrowSize + spacing.lg,
    marginTop: spacing.xs,
  },
  arrow: {
    position: 'absolute',
    top: 0,
  },
  chordButton: {
    alignSelf: 'center',
  },
  caption: {
    ...typography.chip,
    position: 'absolute',
    top: controls.pianoArrowSize,
    flexShrink: 0,
  },
});
