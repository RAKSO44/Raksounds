import { useCallback } from 'react';
import { Linking } from 'react-native';

import { ConfirmDialog } from '@/shared/design-system';

interface MicPermissionDialogProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Aviso de que falta el permiso del micrófono, con un atajo a los ajustes de
 * la app (cuando el sistema ya no vuelve a preguntar, es la única salida). Es
 * el mismo al elegir un ejercicio de entonación y al pulsar el micrófono.
 */
export function MicPermissionDialog({ visible, onClose }: MicPermissionDialogProps) {
  const openSettings = useCallback(() => {
    onClose();
    Linking.openSettings().catch(() => undefined);
  }, [onClose]);

  return (
    <ConfirmDialog
      visible={visible}
      title="Activa el micrófono"
      message="Raksound necesita el micrófono para escucharte cantar. Actívalo en los permisos de la app y vuelve a intentarlo."
      confirmLabel="Activar"
      confirmTone="secondary"
      cancelLabel="Ahora no"
      onConfirm={openSettings}
      onCancel={onClose}
    />
  );
}
