import { PushButton } from '@/shared/design-system';

interface ListenButtonProps {
  label: string;
  /** Ya se escuchó al menos una vez (cambia el ícono a "repetir"). */
  heard?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Botón para escuchar (o volver a escuchar) un ejemplo. Siempre se puede
 * repetir, también después de corregir: oír de nuevo tras un error es parte
 * de la corrección.
 */
export function ListenButton({ label, heard = false, disabled, onPress }: ListenButtonProps) {
  return (
    <PushButton
      variant="selectable"
      tone="secondary"
      selected={heard}
      icon={heard ? 'replay' : 'volume-high'}
      iconPlacement="start"
      label={label}
      disabled={disabled}
      accessibilityLabel={heard ? `${label}: escuchar otra vez` : `${label}: escuchar`}
      onPress={onPress}
    />
  );
}
