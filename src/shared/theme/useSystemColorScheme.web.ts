import { useSyncExternalStore } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

/** El estado de hidratación no cambia nunca después de montar: nada a lo que suscribirse. */
const neverChanges = () => () => {};

/**
 * Esquema de color del sistema en web, en dos pasadas.
 *
 * El sitio se exporta como HTML estático: esa marcación se genera en Node,
 * donde no existe `matchMedia`, así que sale siempre en CLARO. Si el primer
 * render del cliente devolviera ya "dark", React daría por buena la marcación
 * del servidor al hidratar y la página se quedaría en claro hasta que algo la
 * obligase a repintarse — era el bug de "entro con el móvil en oscuro y lo veo
 * claro hasta que toco un botón o cambio el ajuste de apariencia".
 *
 * `useSyncExternalStore` es justo el primitivo para esto: durante la hidratación
 * usa la instantánea del servidor (`false`) y en cuanto termina pasa a la del
 * cliente (`true`), repintando el árbol con el esquema real. Los cambios
 * posteriores del sistema siguen llegando por `useColorScheme`, que ya está
 * suscrito a la media query.
 */
export function useSystemColorScheme(): ColorSchemeName {
  const scheme = useColorScheme();
  const hydrated = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );

  return hydrated ? scheme : 'light';
}
