import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { controls, radii } from '@/shared/theme';

interface PianoKeyBodyProps {
  /** Cuánto está hundida la tecla: 0 en reposo, `controls.pianoKeyLip` pulsada. */
  pressOffset: SharedValue<number>;
  face: string;
  lip: string;
  /** Capa sobre el color del labio (p. ej. el tinte que entra animado). */
  lipOverlay?: ReactNode;
  /** Contenido de la cara: capas de color y rótulos. */
  children?: ReactNode;
}

/**
 * El cuerpo de una tecla de piano dibujada en la app: una cara sobre un labio,
 * con el mismo relieve que un `PushButton`. Lo comparten el teclado de la
 * corrección de entonación y las teclas blancas de la teoría del Home.
 *
 * Al pulsar, la cara NO se desplaza: se estira hacia abajo y tapa el labio.
 * Una tecla de piano está anclada por arriba; si bajara entera, por encima
 * asomaría el fondo del teclado como una franja blanca.
 *
 * Se apoya en un contenedor posicionado (la tecla) que fija ancho y alto.
 */
export function PianoKeyBody({ pressOffset, face, lip, lipOverlay, children }: PianoKeyBodyProps) {
  const faceStyle = useAnimatedStyle(() => ({
    bottom: controls.pianoKeyLip - pressOffset.value,
  }));

  return (
    <>
      <View style={[styles.lip, { backgroundColor: lip }]}>{lipOverlay}</View>
      <Animated.View style={[styles.face, { backgroundColor: face }, faceStyle]}>
        {children}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: controls.pianoKeyLip,
    bottom: 0,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
    overflow: 'hidden',
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: controls.pianoKeyLip,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
    overflow: 'hidden',
  },
});
