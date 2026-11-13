import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ExerciseKind, IntervalId } from '@/domain/ear-training';
import { controls, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { feedbackDetailLabel } from '../labels';

/** translateY inicial, fuera de pantalla, hasta medir el alto real. */
const OFFSCREEN = 2000;

interface AnswerFeedbackSheetProps {
  /** Sube al corregir y baja al pasar al siguiente ejercicio. */
  visible: boolean;
  correct: boolean;
  /** Qué tipo de ejercicio es: decide qué se dice al fallar. */
  kind: ExerciseKind;
  /** Intervalo correcto del ejercicio. */
  answer: IntervalId;
  /** Lo que el usuario eligió. */
  chosen: IntervalId;
  /** Alto de la barra de acción, que tapa la parte baja de la hoja. */
  bottomInset: number;
}

/**
 * Hoja de corrección estilo Duolingo: se desliza desde abajo al confirmar, sin
 * oscurecer la pantalla y sin gesto para descartarla (se cierra sola al pasar
 * de ejercicio). Ocupa todo el ancho y llega hasta el borde inferior, tapando
 * el contenido del ejercicio; lo único que queda por encima es el botón de
 * acción, que flota sobre ella (la barra se vuelve transparente mientras la
 * hoja está arriba). Por eso reserva `bottomInset` —el alto de esa barra— y no
 * redondea sus esquinas superiores.
 *
 * El contenido se "congela" mientras la hoja baja: si no, al avanzar al
 * siguiente ejercicio se vería un fotograma con la corrección equivocada.
 */
export function AnswerFeedbackSheet({
  visible,
  correct,
  kind,
  answer,
  chosen,
  bottomInset,
}: AnswerFeedbackSheetProps) {
  const { colors } = useTheme();

  // Instantánea del último contenido mostrado, junto al `visible` con el que se
  // tomó. Solo se refresca en el flanco de SUBIDA, que es cuando la corrección
  // es la del ejercicio en pantalla; al bajar se conserva tal cual.
  const [displayed, setDisplayed] = useState({ visible, correct, kind, answer, chosen });
  if (visible !== displayed.visible) {
    setDisplayed(visible ? { visible, correct, kind, answer, chosen } : { ...displayed, visible });
  }

  // Empieza muy abajo (aún no se conoce el alto real): así no hay un fotograma
  // con la hoja visible antes de la primera medición.
  const translateY = useSharedValue(OFFSCREEN);
  const [height, setHeight] = useState(0);
  const measured = useRef(false);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeight(next);
    if (!measured.current) {
      measured.current = true;
      // Primera medición: colócala en su sitio sin animar.
      translateY.value = visible ? 0 : next;
    }
  };

  useEffect(() => {
    if (!measured.current) return;
    translateY.value = withTiming(visible ? 0 : height, {
      duration: motion.sheet,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, height, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // Verde y rojo de resultado: los MISMOS en claro y oscuro, como en el resto
  // de la familia de apps.
  const background = displayed.correct ? colors.resultSuccess : colors.resultDanger;
  const foreground = displayed.correct ? colors.resultSuccessText : colors.resultDangerText;

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.sheet, { backgroundColor: background }, sheetStyle]}
    >
      <View style={[styles.inner, { paddingBottom: bottomInset + spacing.md }]}>
        <View style={[styles.badge, { backgroundColor: foreground }]}>
          <MaterialCommunityIcons
            name={displayed.correct ? 'check' : 'close'}
            size={22}
            color={colors.textOnBrand}
          />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, { color: foreground }]}>
            {displayed.correct ? '¡Correcto!' : 'Casi'}
          </Text>
          <Text style={[styles.detail, { color: foreground }]}>
            {feedbackDetailLabel(displayed)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Sobre el contenido del ejercicio, bajo la barra de acción.
    zIndex: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  badge: {
    width: controls.feedbackBadgeSize,
    height: controls.feedbackBadgeSize,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.headerTitle,
  },
  detail: {
    ...typography.chip,
  },
});
