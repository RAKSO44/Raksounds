// react-native-reanimated corre sobre worklets/JSI, que no existen en Node.
// Sin factory, Jest usa el mock manual de __mocks__/react-native-reanimated.js.
jest.mock('react-native-reanimated');

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
