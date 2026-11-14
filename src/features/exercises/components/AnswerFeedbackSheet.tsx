import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  controls,
  motion,
  radii,
  spacing,
  ThemeColors,
  typography,
  useTheme,
} from '@/shared/theme';

/**
 * Resultado que pinta la hoja. Los ejercicios auditivos solo usan `correct` y
 * `wrong`; los de entonación añaden los matices `perfect` (clavado) y `close`
 * (la nota correcta, desafinada), que se pintan aparte para no desanimar.
 */
export type FeedbackResult = 'perfect' | 'correct' | 'close' | 'wrong';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const RESULT_ICONS: Record<FeedbackResult, IconName> = {
  perfect: 'star',
  correct: 'check',
  close: 'tilde',
  wrong: 'close',
};

/** Fondo y texto/insignia de cada resultado. Iguales en claro y oscuro. */
function resultColors(result: FeedbackResult, colors: ThemeColors) {
  switch (result) {
    case 'perfect':
      return { background: colors.resultPerfect, foreground: colors.resultPerfectText };
    case 'correct':
      return { background: colors.resultSuccess, foreground: colors.resultSuccessText };
    case 'close':
      return { background: colors.resultWarning, foreground: colors.resultWarningText };
    case 'wrong':
      return { background: colors.resultDanger, foreground: colors.resultDangerText };
  }
}

/** translateY inicial, fuera de pantalla, hasta medir el alto real. */
const OFFSCREEN = 2000;

interface AnswerFeedbackSheetProps {
  /** Sube al corregir y baja al pasar al siguiente ejercicio. */
  visible: boolean;
  /** Decide el color y el ícono. */
  result: FeedbackResult;
  /** Primera línea ("¡Correcto!", "Casi"). */
  title: string;
  /** Segunda línea: qué era o qué se respondió. */
  detail: string;
  /** Alto de la barra de acción, que tapa la parte baja de la hoja. */
  bottomInset: number;
  /**
   * Contenido que sube pegado ENCIMA de la tarjeta de color, sobre el fondo de
   * la pantalla (la barra de afinación de la entonación).
   */
  accessory?: ReactNode;
  /** Alto total medido de la hoja (accesorio incluido). */
  onHeight?: (height: number) => void;
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
  result,
  title,
  detail,
  bottomInset,
  accessory,
  onHeight,
}: AnswerFeedbackSheetProps) {
  const { colors } = useTheme();

  // Instantánea del último contenido mostrado, junto al `visible` con el que se
  // tomó. Solo se refresca en el flanco de SUBIDA, que es cuando la corrección
  // es la del ejercicio en pantalla; al bajar se conserva tal cual.
  const [displayed, setDisplayed] = useState({ visible, result, title, detail, accessory });
  if (visible !== displayed.visible) {
    setDisplayed(
      visible ? { visible, result, title, detail, accessory } : { ...displayed, visible },
    );
  }

  // Empieza muy abajo (aún no se conoce el alto real): así no hay un fotograma
  // con la hoja visible antes de la primera medición.
  const translateY = useSharedValue(OFFSCREEN);
  const [height, setHeight] = useState(0);
  const measured = useRef(false);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeight(next);
    onHeight?.(next);
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

  // Colores de resultado: los MISMOS en claro y oscuro, como en el resto de la
  // familia de apps.
  const { background, foreground } = resultColors(displayed.result, colors);

  return (
    <Animated.View pointerEvents="none" onLayout={onLayout} style={[styles.sheet, sheetStyle]}>
      {displayed.accessory != null && (
        <View style={[styles.accessory, { backgroundColor: colors.background }]}>
          {displayed.accessory}
        </View>
      )}
      <View
        style={[
          styles.inner,
          { backgroundColor: background, paddingBottom: bottomInset + spacing.md },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: foreground }]}>
          <MaterialCommunityIcons
            name={RESULT_ICONS[displayed.result]}
            size={22}
            color={colors.textOnBrand}
          />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, { color: foreground }]}>{displayed.title}</Text>
          <Text style={[styles.detail, { color: foreground }]}>{displayed.detail}</Text>
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
  accessory: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
