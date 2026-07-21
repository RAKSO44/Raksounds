import { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { hapticTap } from '@/shared/haptics';
import { typography, useTheme } from '@/shared/theme';

interface CreditLinkProps {
  label: string;
  /** Destino: `mailto:`, `https://`, etc. */
  url: string;
}

/**
 * Texto que abre un destino externo (correo o web). Es la "redirección" de un
 * crédito: al tocar el nombre o la fuente de una muestra se sale de la app.
 */
export function CreditLink({ label, url }: CreditLinkProps) {
  const { colors } = useTheme();

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          hapticTap();
          // Si el equipo no tiene app para ese esquema, no pasa nada.
          Linking.openURL(url).catch(() => {});
        }),
    [url],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View accessible accessibilityRole="link" accessibilityLabel={label}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.chip,
    textDecorationLine: 'underline',
  },
});
