// react-native-reanimated corre sobre worklets/JSI, que no existen en Node.
// Sin factory, Jest usa el mock manual de __mocks__/react-native-reanimated.js.
jest.mock('react-native-reanimated');

// react-native-gesture-handler reconoce gestos en el lado NATIVO, así que en
// Jest un GestureDetector real nunca se activaría (y además su implementación
// llama a hooks de reanimated que el mock manual no cubre).
//
// Se sustituye solo el GestureDetector por un Pressable que dispara los MISMOS
// callbacks del gesto, en el mismo orden que en un toque completo real
// (onStart → onEnd → onFinalize). El resto de la librería —incluido el
// constructor `Gesture`, del que sale ese objeto de callbacks— es el de verdad.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { Pressable, View } = require('react-native');
  const actual = jest.requireActual('react-native-gesture-handler');

  return {
    ...actual,
    GestureHandlerRootView: View,
    GestureDetector: ({ gesture: composed, children }) => {
      // Un gesto compuesto (tocar O arrastrar una ficha) se prueba por su
      // parte de toque: arrastrar necesita coordenadas que Node no tiene.
      const gesture = composed.gestures
        ? (composed.gestures.find((g) => g.handlerName === 'TapGestureHandler') ??
          composed.gestures[0])
        : composed;
      const { onBegin, onStart, onEnd, onFinalize } = gesture.handlers ?? {};
      const event = {};
      return React.createElement(
        Pressable,
        {
          disabled: gesture.config?.enabled === false,
          onPressIn: () => {
            onBegin?.(event);
            onStart?.(event);
          },
          onPress: () => {
            onEnd?.(event, true);
            onFinalize?.(event, true);
          },
        },
        children,
      );
    },
  };
});

// react-native-mmkv es un módulo nativo (JSI): no existe en Node. Se sustituye
// por un almacén en memoria con la misma API para que los stores persistidos
// funcionen en los tests sin tocar disco.
jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const store = new Map();
    return {
      getString: (key) => (store.has(key) ? store.get(key) : undefined),
      set: (key, value) => store.set(key, value),
      remove: (key) => store.delete(key),
    };
  };
  return { createMMKV };
});

// Los efectos de sonido de los ejercicios abren su propio AudioContext nativo.
// Se sustituye la instancia única (no el motor: su test lo prueba contra un
// doble de react-native-audio-api) para que las pantallas puedan afirmar qué
// efecto sonó con `jest.requireMock('@/infrastructure/audio/soundEffects')`.
// El metrónomo de las lecciones, por el mismo motivo (su motor tiene su propio
// test). `play` devuelve la referencia de reloj como lo haría el real.
jest.mock('@/infrastructure/audio/metronome', () => ({
  metronome: {
    load: jest.fn().mockResolvedValue(undefined),
    play: jest.fn(() => 0),
    loop: jest.fn(() => ({ startMs: 0, setBpm: jest.fn(), stop: jest.fn() })),
    stop: jest.fn(),
  },
}));

jest.mock('@/infrastructure/audio/soundEffects', () => ({
  soundEffects: {
    load: jest.fn().mockResolvedValue(undefined),
    play: jest.fn(),
  },
}));

// En Node no hay layout: `measureLayout` de una vista simulada es un jest.fn
// que nunca responde. Se responde como una vista ya colocada (en el origen),
// para que lo que espera esa medida (el globo de una definición) aparezca.
{
  const { View } = require('react-native');
  View.prototype.measureLayout = function measureLayout(_relativeTo, onSuccess) {
    onSuccess?.(0, 0, 0, 0);
  };
}
