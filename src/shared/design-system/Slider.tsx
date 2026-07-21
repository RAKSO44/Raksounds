import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { hapticPressIn, hapticPressOut, hapticTap } from '@/shared/haptics';
import { radii, useTheme } from '@/shared/theme';

/** Grosor de la barra. Constante: no cambia al presionarla. */
const TRACK_HEIGHT = 34;
/** Salto de las acciones de accesibilidad (incrementar/decrementar). */
const A11Y_STEP = 0.1;
/**
 * Radio de captura del imán (`detent`), en fracción del recorrido. Sin él es
 * casi imposible dejar el deslizable EXACTAMENTE en su valor por defecto con
 * el dedo; con 3% se siente como si encajara solo.
 */
const DETENT_RADIUS = 0.03;

interface SliderProps {
  /** Posición actual, de 0 a 1. */
  value: number;
  /** Se dispara de forma continua mientras se arrastra. */
  onChange: (value: number) => void;
  /**
   * Valor "imán" opcional (p. ej. 0.5): al pasar cerca, el deslizable encaja
   * en él exactamente y da un golpe seco.
   */
  detent?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Deslizable de 0 a 1 sin perilla: la barra entera es el control.
 *
 * Es RELATIVO, no absoluto: apoyar el dedo no mueve nada: el valor solo cambia
 * con el DESPLAZAMIENTO del gesto, sumado a donde estaba la barra al empezar.
 * Así se puede agarrar desde cualquier punto —incluido el extremo opuesto al
 * valor actual— sin que la barra pegue un salto bajo el dedo, y ajustar de a
 * poco sin tener que apuntar.
 *
 * El gesto es un `Pan` con `activeOffsetX`: solo se activa con movimiento
 * horizontal, así que arrastrar en vertical sigue haciendo scroll de la
 * pantalla en vez de quedarse "pegado" al deslizable. No hay gesto de toque:
 * un tap sin desplazamiento no debe mover el volumen.
 *
 * Los colores y el radio salen del theme: sigue siendo un control Duolingo.
 */
export function Slider({ value, onChange, detent, accessibilityLabel, style }: SliderProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  /**
   * Valor en el instante en que el dedo tocó: el origen del desplazamiento. Es
   * un shared value de reanimated y no un `useRef` porque los callbacks del
   * gesto se construyen durante el render, y leer un ref ahí es justo lo que
   * React desaconseja (y la regla `react-hooks/refs` prohíbe).
   */
  const valueAtStart = useSharedValue(value);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  /**
   * Publica el nuevo valor y marca los puntos notables con un golpe seco: los
   * dos topes y el imán. Solo al LLEGAR a ellos (no mientras se sigue
   * arrastrando contra el borde, o vibraría en cada fotograma). Es `hapticTap`,
   * el golpe único de los controles no alzados, no el par press-in/press-out de
   * los botones con relieve.
   */
  const commit = useCallback(
    (next: number) => {
      if (next === value) return;
      if (next === 0 || next === 1 || next === detent) hapticTap();
      onChange(next);
    },
    [onChange, value, detent],
  );

  // Se fija con el dedo ya apoyado: todo el arrastre se mide contra este
  // origen, así que recorrer el ancho entero recorre todo el rango sin importar
  // desde dónde se agarró.
  const handleBegin = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    valueAtStart.value = value;
  }, [value, valueAtStart]);

  const handleUpdate = useCallback(
    (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      if (trackWidth === 0) return;
      const raw = clamp01(valueAtStart.value + event.translationX / trackWidth);
      // El imán captura antes de publicar: así el valor sale exacto.
      const next = detent != null && Math.abs(raw - detent) <= DETENT_RADIUS ? detent : raw;
      commit(next);
    },
    [commit, trackWidth, detent, valueAtStart],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-8, 8])
        .onBegin(handleBegin)
        .onStart(hapticPressIn)
        .onUpdate(handleUpdate)
        .onFinalize(hapticPressOut),
    [handleBegin, handleUpdate],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(value) * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === 'increment' ? A11Y_STEP : -A11Y_STEP;
          commit(clamp01(value + delta));
        }}
        onLayout={handleLayout}
        style={[styles.root, style]}
      >
        <View style={[styles.track, { backgroundColor: colors.surfaceShadow }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.brand, width: `${clamp01(value) * 100}%` },
            ]}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    height: TRACK_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
  },
});
