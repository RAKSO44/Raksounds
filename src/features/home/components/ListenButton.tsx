import { PushButton } from '@/shared/design-system';
import { controls } from '@/shared/theme';

interface ListenButtonProps {
  /** Texto junto al ícono. Sin él, el botón es solo el parlante. */
  label?: string;
  /** Qué suena, para el lector de pantalla (por defecto, el texto). */
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Botón para escuchar un ejemplo: celeste a color entero y SIEMPRE con el
 * parlante (no cambia a "repetir" tras oírlo: se puede pulsar las veces que
 * haga falta, también después de corregir). Suena al tocarlo, no al soltarlo,
 * como una tecla.
 */
export function ListenButton({ label, accessibilityLabel, disabled, onPress }: ListenButtonProps) {
  return (
    <PushButton
      variant="solid"
      tone="secondary"
      icon="volume-high"
      iconPlacement="start"
      label={label}
      disabled={disabled}
      // Solo el parlante: ancho de botón, no de ícono, para acertarle fácil.
      minWidth={label === undefined ? controls.listenButtonMinWidth : undefined}
      accessibilityLabel={`${accessibilityLabel ?? label ?? 'Sonido'}: escuchar`}
      onPressIn={onPress}
    />
  );
}
