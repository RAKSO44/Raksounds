import { useWindowDimensions } from 'react-native';

import { breakpoints } from './tokens';

/**
 * `true` cuando el ancho de la ventana alcanza el breakpoint de layout
 * "ancho" (`breakpoints.wide`). Es la única señal que decide si la
 * navegación se muestra como tab bar inferior o riel lateral — ver
 * `DuolingoTabBar` y `.claude/rules/architecture.md`.
 */
export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= breakpoints.wide;
}
