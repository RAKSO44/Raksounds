import {
  createContext,
  Fragment,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

type MountLayer = (key: string, node: ReactNode | null) => void;

const OverlayContext = createContext<MountLayer | null>(null);

/**
 * La capa más alta de la app, por encima de las pestañas y las cabeceras. Lo
 * que se pinta con `Overlay` aparece aquí, en el MISMO árbol de vistas (no en
 * una ventana nativa aparte como un `Modal`): no hay fotograma en blanco al
 * abrirse, y una animación puede partir exactamente de una pieza de la
 * pantalla de debajo.
 *
 * Va una sola vez, en la raíz (`app/_layout.tsx`), dentro del tema y del safe
 * area para que lo superpuesto los herede.
 */
export function OverlayHost({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<ReadonlyMap<string, ReactNode>>(() => new Map());

  const mount = useCallback<MountLayer>((key, node) => {
    setLayers((previous) => {
      const next = new Map(previous);
      if (node === null) next.delete(key);
      else next.set(key, node);
      return next;
    });
  }, []);

  return (
    <OverlayContext.Provider value={mount}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {[...layers].map(([key, node]) => (
          <Fragment key={key}>{node}</Fragment>
        ))}
      </View>
    </OverlayContext.Provider>
  );
}

/**
 * Pinta `children` en la capa superior (`OverlayHost`), tapando toda la app.
 * Sin anfitrión (un test que monta una pantalla suelta) se pinta en su sitio.
 */
export function Overlay({ children }: { children: ReactNode }) {
  const mount = useContext(OverlayContext);
  const key = useId();

  useEffect(() => {
    mount?.(key, children);
  }, [mount, key, children]);
  useEffect(() => () => mount?.(key, null), [mount, key]);

  if (mount !== null) return null;
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {children}
    </View>
  );
}
