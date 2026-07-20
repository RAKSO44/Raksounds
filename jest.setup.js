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
    GestureDetector: ({ gesture, children }) => {
      const { onStart, onEnd, onFinalize } = gesture.handlers ?? {};
      const event = {};
      return React.createElement(
        Pressable,
        {
          disabled: gesture.config?.enabled === false,
          onPressIn: () => onStart?.(event),
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
