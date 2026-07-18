import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PushButton } from '@/shared/design-system';
import { ThemeMode } from '@/shared/settings';
import { spacing } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const OPTIONS: readonly { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'light', label: 'Claro', icon: 'white-balance-sunny' },
  { mode: 'dark', label: 'Oscuro', icon: 'weather-night' },
  { mode: 'system', label: 'Sistema', icon: 'monitor' },
];

interface ThemeModeSelectorProps {
  selected: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

/**
 * Selector de apariencia: tres botones (claro/oscuro/sistema). El elegido se
 * pinta como botón sólido de marca ("color entero") y el resto quedan neutros,
 * manteniendo el relieve 3D y el snap instantáneo del `PushButton`.
 */
export function ThemeModeSelector({ selected, onSelect }: ThemeModeSelectorProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map(({ mode, label, icon }) => (
        <PushButton
          key={mode}
          label={label}
          icon={icon}
          variant={selected === mode ? 'solid' : 'selectable'}
          onPress={() => onSelect(mode)}
          accessibilityLabel={`Tema ${label}`}
          style={styles.button}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
