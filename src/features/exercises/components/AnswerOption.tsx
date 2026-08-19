import { ComponentProps, useEffect } from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IntervalId } from '@/domain/ear-training';
import { PushButton, PushButtonTone } from '@/shared/design-system';
import { controls, motion } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Estado visual de una opción:
 * - `idle`: sin elegir.
 * - `selected`: elegida, aún sin corregir (celeste).
 * - `correct`: elegida y acertada (verde).
 * - `wrong`: elegida y fallada (rojo).
 * - `answer`: no la eligió, pero era la correcta (morado).
 */
export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'answer';

const STATE_TONES: Record<AnswerOptionState, PushButtonTone> = {
  idle: 'secondary',
  selected: 'secondary',
  correct: 'success',
  wrong: 'danger',
  answer: 'brand',
};

interface AnswerOptionStateInput {
  option: IntervalId;
  /** Opción marcada por el usuario. */
  selected: IntervalId | null;
  /** Opción correcta del ejercicio. */
  answer: IntervalId;
  /** `true` cuando ya se confirmó y toca mostrar la corrección. */
  revealed: boolean;
}

/**
 * Estado visual de una opción a partir del estado del ejercicio. Antes de
 * corregir solo hay elegida/no elegida; después, la elegida se pinta según
 * acierte o falle y la correcta se destaca aunque no se haya elegido.
 */
export function answerOptionState({
  option,
  selected,
  answer,
  revealed,
}: AnswerOptionStateInput): AnswerOptionState {
  if (!revealed) return option === selected ? 'selected' : 'idle';
  if (option === selected) return option === answer ? 'correct' : 'wrong';
  return option === answer ? 'answer' : 'idle';
}

interface AnswerOptionProps {
  /** Ausente en una opción que es solo sonido (identificación de nota). */
  label?: string;
  sublabel?: string;
  icon?: IconName;
  /** Tamaño del texto de la cara (el color lo fija el propio botón). */
  labelStyle?: StyleProp<TextStyle>;
  state: AnswerOptionState;
  /** Posición en la fila; escalona la entrada de las opciones. */
  index: number;
  disabled?: boolean;
  accessibilityLabel: string;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress?: () => void;
}

/**
 * Una opción de respuesta. Encima del `PushButton` del design system añade el
 * temblor lateral breve del fallo, el mismo recurso que usa Duolingo para decir
 * "esa no" sin bloquear la pantalla. El acierto NO se anima: se cuenta en la
 * hoja de corrección que sube desde abajo.
 *
 * La entrada va escalonada por posición para que las opciones no aparezcan
 * todas de golpe al cambiar de ejercicio.
 */
export function AnswerOption({
  label,
  sublabel,
  icon,
  labelStyle,
  state,
  index,
  disabled,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  onPress,
}: AnswerOptionProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (state !== 'wrong') return;
    translateX.value = withSequence(
      withTiming(-controls.shakeDistance, { duration: motion.shake }),
      withTiming(controls.shakeDistance, { duration: motion.shake }),
      withTiming(-controls.shakeDistance / 2, { duration: motion.shake }),
      withTiming(0, { duration: motion.shake }),
    );
  }, [state, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.enter).delay(index * motion.stagger)}
      style={[styles.option, animatedStyle]}
    >
      <PushButton
        variant="selectable"
        tone={STATE_TONES[state]}
        selected={state !== 'idle'}
        label={label}
        sublabel={sublabel}
        icon={icon}
        labelStyle={labelStyle}
        fullWidth
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    // Las opciones de una fila reparten el ancho en partes iguales.
    flex: 1,
  },
});
