import { Switch } from 'react-native';

import { hapticPressIn } from '@/shared/haptics';
import { useTheme } from '@/shared/theme';

interface SettingToggleProps {
  /** Nombre accesible del interruptor (la sección ya rotula el ajuste). */
  accessibilityLabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/**
 * Interruptor on/off tematizado (track morado de marca al estar activo). Se
 * coloca a la altura del título de su sección; el propio ajuste lo rotula la
 * cabecera, así que aquí no se repite label ni descripción. Se agranda un poco
 * (`scale`) para que quede cómodo al pulgar sin perder el tamaño nativo.
 */
export function SettingToggle({ accessibilityLabel, value, onValueChange }: SettingToggleProps) {
  const { colors } = useTheme();

  const handleChange = (next: boolean) => {
    hapticPressIn();
    onValueChange(next);
  };

  return (
    <Switch
      value={value}
      onValueChange={handleChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.surfaceShadow, true: colors.brand }}
      thumbColor={colors.textOnBrand}
      ios_backgroundColor={colors.surfaceShadow}
      style={{ transform: [{ scale: 1.25 }] }}
    />
  );
}
