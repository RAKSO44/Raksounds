// Mock manual y autocontenido de react-native-reanimated para Jest.
//
// El mock oficial de la librería importa react-native-worklets, que requiere
// JSI y falla en Node. Aquí solo reproducimos la API que usa la app: el objeto
// Animated (con componentes = componentes RN normales), los hooks básicos y los
// constructores de animaciones de layout como no-ops encadenables.
const React = require('react');
const { View, Text, ScrollView, Image } = require('react-native');

// Constructor de animaciones (FadeIn, LinearTransition, …): cualquier método
// encadenado (.duration().delay().springify()…) devuelve el mismo objeto.
const animationBuilder = new Proxy(
  {},
  {
    get: () => () => animationBuilder,
  },
);

const Animated = {
  View,
  Text,
  ScrollView,
  Image,
  createAnimatedComponent: (Component) => Component,
};

// Curvas de easing: en un test no hay tiempo que interpolar, así que basta con
// que existan y sean encadenables (Easing.out(Easing.cubic)).
const easingFn = () => 0;
const Easing = new Proxy(
  {},
  {
    get: () => () => easingFn,
  },
);

module.exports = {
  __esModule: true,
  default: Animated,
  Easing,
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withTiming: (toValue) => toValue,
  withSpring: (toValue) => toValue,
  // Una secuencia acaba en su último paso: es el valor que tendría la
  // animación al terminar, que es lo único observable desde un test.
  withSequence: (...steps) => steps[steps.length - 1],
  withDelay: (_delay, animation) => animation,
  runOnJS: (fn) => fn,
  FadeIn: animationBuilder,
  FadeInDown: animationBuilder,
  FadeInUp: animationBuilder,
  FadeOut: animationBuilder,
  FadeOutUp: animationBuilder,
  FadeOutDown: animationBuilder,
  LinearTransition: animationBuilder,
  // Algunos consumidores esperan también estos helpers de React.
  useAnimatedRef: () => React.createRef(),
};
