import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Intercepta el botón "atrás" del sistema (Android) mientras el componente está
 * montado.
 *
 * El manejador devuelve si CONSUMIÓ el evento: `true` lo detiene ahí (la
 * pantalla decide por su cuenta qué significa volver) y `false` lo deja seguir
 * su curso normal, que es lo que permite que una pantalla apilada se cierre
 * como siempre. Los manejadores corren del más reciente al más antiguo, así que
 * la pantalla de arriba siempre tiene la última palabra.
 *
 * En web y en iOS `BackHandler` no emite nada, así que el hook simplemente no
 * hace nada ahí.
 */
export function useHardwareBack(onBack: () => boolean): void {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [onBack]);
}
