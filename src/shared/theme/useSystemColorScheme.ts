import { ColorSchemeName, useColorScheme } from 'react-native';

/**
 * Esquema de color del sistema operativo. En nativo es directamente el de
 * React Native: la app se pinta desde el primer fotograma con el esquema real,
 * sin pasar por claro.
 *
 * La variante web (`useSystemColorScheme.web.ts`) existe porque allí el HTML
 * viene pregenerado y el primer render tiene que coincidir con él.
 */
export function useSystemColorScheme(): ColorSchemeName {
  return useColorScheme();
}
