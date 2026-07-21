import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DEFAULT_VOLUME } from '@/domain/audio/volume';
import { Slider } from '@/shared/design-system';
import { spacing, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON_SIZE = 24;

/**
 * El ícono refleja cuánto volumen hay, así que sirve de indicador y no hace
 * falta mostrar un número: en silencio se tacha y luego va ganando ondas.
 */
function volumeIcon(value: number): IconName {
  if (value <= 0) return 'volume-off';
  if (value <= 1 / 3) return 'volume-low';
  if (value <= 2 / 3) return 'volume-medium';
  return 'volume-high';
}

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

/** Control del volumen de la app, con el ícono de estado a la derecha. */
export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {/* El imán está en el volumen normal: se puede volver al valor con el
          que llegó la app sin tener que afinar el dedo. */}
      <Slider
        value={value}
        onChange={onChange}
        detent={DEFAULT_VOLUME}
        accessibilityLabel="Volumen"
        style={styles.slider}
      />
      {/* Ancho fijo: los glifos no miden igual y sin esto el deslizable se
          encogería y estiraría al cambiar de ícono. */}
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name={volumeIcon(value)}
          size={ICON_SIZE}
          color={colors.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  slider: {
    flex: 1,
  },
  icon: {
    width: ICON_SIZE,
    alignItems: 'center',
  },
});
