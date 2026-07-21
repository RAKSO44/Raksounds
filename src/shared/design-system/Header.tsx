import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticTap } from '@/shared/haptics';
import { spacing, typography, useTheme } from '@/shared/theme';

interface HeaderProps {
  title: string;
  /** Si se pasa, la cabecera muestra una flecha de volver a su izquierda. */
  onBack?: () => void;
}

/**
 * Cabecera de marca (morada). Pinta también el área de la barra de estado
 * (inset superior) para que el sistema operativo no "choque" con el contenido
 * y la status bar quede del mismo color que la cabecera.
 */
export function Header({ title, onBack }: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Como en el resto de controles, el gesto va con gesture-handler y no con
  // Pressable (ver PushButton).
  const backGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          hapticTap();
          onBack?.();
        }),
    [onBack],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.brand, paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {onBack != null && (
          <GestureDetector gesture={backGesture}>
            <View accessible accessibilityRole="button" accessibilityLabel="Volver">
              <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textOnBrand} />
            </View>
          </GestureDetector>
        )}
        <Text style={[styles.title, { color: colors.textOnBrand }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.headerTitle,
  },
});
