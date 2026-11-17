import { ComponentProps, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticTap } from '@/shared/haptics';
import { spacing, typography, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Botón de ícono en el extremo derecho de la cabecera (p. ej. ajustes). */
export interface HeaderAction {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  /** Si se pasa, la cabecera muestra una flecha de volver a su izquierda. */
  onBack?: () => void;
  /** Acción opcional pegada a la derecha. */
  action?: HeaderAction;
}

/**
 * Cabecera de marca (morada). Pinta también el área de la barra de estado
 * (inset superior) para que el sistema operativo no "choque" con el contenido
 * y la status bar quede del mismo color que la cabecera.
 */
export function Header({ title, onBack, action }: HeaderProps) {
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

  const actionGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          hapticTap();
          action?.onPress();
        }),
    [action],
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
        {action != null && (
          <GestureDetector gesture={actionGesture}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              style={styles.action}
            >
              <MaterialCommunityIcons name={action.icon} size={28} color={colors.textOnBrand} />
            </View>
          </GestureDetector>
        )}
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
    flex: 1,
  },
  action: {
    padding: spacing.xs,
  },
});
