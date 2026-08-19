import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';

import { ConfirmDialog } from '@/shared/design-system';

import { useHardwareBack } from './useHardwareBack';

/**
 * Confirma antes de cerrar la app con el botón "atrás" del sistema.
 *
 * Solo actúa cuando ya no queda a dónde volver (`canGoBack()` es falso, es
 * decir: se está en la raíz de las pestañas). Si hay pantallas apiladas encima
 * —Créditos, una ronda— deja pasar el evento para que se cierren como siempre;
 * y una pantalla apilada que quiera decidir por su cuenta registra su propio
 * manejador, que corre antes que este.
 */
export function ExitConfirmation() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) return false;
    setConfirming(true);
    return true;
  }, [router]);

  useHardwareBack(handleBack);

  return (
    <ConfirmDialog
      visible={confirming}
      title="¿Salir de Raksound?"
      message="Se cerrará la aplicación."
      confirmLabel="Salir"
      cancelLabel="Quedarme"
      onConfirm={() => BackHandler.exitApp()}
      onCancel={() => setConfirming(false)}
    />
  );
}
