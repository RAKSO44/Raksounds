import { StyleSheet } from 'react-native';

import { PushButton } from '@/shared/design-system';
import { controls, typography } from '@/shared/theme';

interface TapPadProps {
  disabled?: boolean;
  onTap: () => void;
}

/**
 * El botón grande para tocar el pulso. El toque se registra al TOCAR
 * (`onPressIn`), no al soltar: soltar llega decenas de ms tarde y eso
 * desplazaría todos los toques.
 */
export function TapPad({ disabled, onTap }: TapPadProps) {
  return (
    <PushButton
      variant="solid"
      tone="secondary"
      label="TAP"
      icon="gesture-tap"
      labelStyle={typography.title}
      fullWidth
      fillHeight
      style={styles.pad}
      disabled={disabled}
      accessibilityLabel="Tocar el pulso"
      onPressIn={onTap}
    />
  );
}

const styles = StyleSheet.create({
  pad: {
    height: controls.tapPadHeight,
  },
});
