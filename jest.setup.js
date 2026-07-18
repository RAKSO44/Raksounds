// react-native-reanimated corre sobre worklets/JSI, que no existen en Node.
// Sin factory, Jest usa el mock manual de __mocks__/react-native-reanimated.js.
jest.mock('react-native-reanimated');
