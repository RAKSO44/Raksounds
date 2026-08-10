import type { ComponentType } from 'react';
import { Switch, type SwitchProps } from 'react-native';

import { hapticTap } from '@/shared/haptics';
import { useTheme } from '@/shared/theme';

interface SettingToggleProps {
  /** Nombre accesible del interruptor (la sección ya rotula el ajuste). */
  accessibilityLabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// react-native-web's Switch (a diferencia del Switch nativo) usa un color de
// thumb DISTINTO para el estado activo (`activeThumbColor`, no tipado por
// @types/react-native porque es propio de la implementación web) y por
// defecto es un teal (#009688) si no se pasa. Sin este cast quedaba el
// círculo del toggle en cyan al activarse solo en web.
const ThemedSwitch = Switch as ComponentType<SwitchProps & { activeThumbColor?: string }>;

/**
 * Interruptor on/off tematizado (track morado de marca al estar activo). Se
 * coloca a la altura del título de su sección; el propio ajuste lo rotula la
 * cabecera, así que aquí no se repite label ni descripción. Se agranda un poco
 * (`scale`) para que quede cómodo al pulgar sin perder el tamaño nativo.
 */
export function SettingToggle({ accessibilityLabel, value, onValueChange }: SettingToggleProps) {
  const { colors } = useTheme();

  const handleChange = (next: boolean) => {
    hapticTap();
    onValueChange(next);
  };

  return (
    <ThemedSwitch
      value={value}
      onValueChange={handleChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.surfaceShadow, true: colors.brand }}
      thumbColor={colors.textOnBrand}
      activeThumbColor={colors.textOnBrand}
      ios_backgroundColor={colors.surfaceShadow}
      style={{ transform: [{ scale: 1.25 }] }}
    />
  );
}
