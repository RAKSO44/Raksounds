import { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PushButton } from '@/shared/design-system';
import { motion, spacing, typography, useTheme } from '@/shared/theme';

interface BottomActionBarProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  /** Contenido opcional encima del botón (la corrección de la respuesta). */
  children?: ReactNode;
}

/**
 * Barra fija inferior con la acción principal, como el "Continuar" de una
 * lección de Duolingo: separada del contenido por un borde, siempre a la vista
 * y respetando el inset del sistema.
 *
 * El botón es SIEMPRE el mismo (mismo color, misma forma): entre "Comprobar" y
 * "Continuar" solo cambia el texto. Cuando pasa de deshabilitado a habilitado
 * da un "pop" muy corto, que es la señal de que ya se puede avanzar.
 */
export function BottomActionBar({
  label,
  disabled = false,
  onPress,
  children,
}: BottomActionBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(1.03, { duration: motion.pop }),
      withSpring(1, { damping: 14, stiffness: 220 }),
    );
  }, [disabled, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      {children}
      <Animated.View style={popStyle}>
        <PushButton
          variant="solid"
          tone="secondary"
          label={label}
          labelStyle={typography.headerTitle}
          fullWidth
          disabled={disabled}
          onPress={onPress}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 2,
    padding: spacing.md,
    gap: spacing.md,
  },
});
