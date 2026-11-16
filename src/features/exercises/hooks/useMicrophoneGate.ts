import { useCallback, useRef, useState } from 'react';

// Punto de composición con la implementación real del micrófono (nativo o web
// según la plataforma, por la extensión `.web.ts`).
import { microphone } from '@/infrastructure/audio/microphone';

export interface MicrophoneGate {
  /** El último pedido fue rechazado: hay que mostrar el aviso de permiso. */
  denied: boolean;
  /**
   * Pide el permiso y, si se concede, ejecuta `onGranted`. Se pide en CADA
   * llamada: si el usuario lo negó, volver a pulsar vuelve a preguntar.
   */
  requestThen: (onGranted: () => void) => void;
  /** Cierra el aviso. */
  dismiss: () => void;
}

/**
 * Puerta de entrada a los ejercicios de entonación: sin micrófono no hay nada
 * que hacer en ellos, así que el permiso se pide al elegirlos y no al llegar
 * al botón del micrófono. Solo un "no" explícito cierra la puerta; si el
 * sistema no puede preguntar (`unavailable`) se deja pasar y el propio
 * ejercicio explica el problema al intentar cantar.
 */
export function useMicrophoneGate(): MicrophoneGate {
  const [denied, setDenied] = useState(false);
  // Un doble toque no debe abrir dos diálogos de permiso del sistema.
  const asking = useRef(false);

  const requestThen = useCallback((onGranted: () => void) => {
    if (asking.current) return;
    asking.current = true;
    microphone.requestPermission().then((result) => {
      asking.current = false;
      if (result === 'denied') setDenied(true);
      else onGranted();
    });
  }, []);

  const dismiss = useCallback(() => setDenied(false), []);

  return { denied, requestThen, dismiss };
}
