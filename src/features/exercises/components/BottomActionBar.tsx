import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PushButton } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

interface BottomActionBarProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  /**
   * Deja pasar lo que haya detrás (la hoja de corrección): sin fondo ni borde,
   * el botón queda flotando sobre el color de la hoja.
   */
  transparent?: boolean;
  /** Alto medido de la barra, para reservarle sitio a lo que quede debajo. */
  onHeight?: (height: number) => void;
}

/**
 * Barra fija inferior con la acción principal, como el "Continuar" de una
 * lección de Duolingo: separada del contenido por un borde, siempre a la vista
 * y respetando el inset del sistema.
 *
 * El botón es SIEMPRE el mismo (mismo color, misma forma): entre "Confirmar" y
 * "Continuar" solo cambia el texto. Al habilitarse NO hace nada: no crece ni
 * rebota — habilitarse ya se ve por el cambio de color.
 *
 * Mientras la hoja de corrección está arriba la barra se vuelve `transparent`:
 * el color de la hoja llega hasta el borde inferior de la pantalla y el botón
 * flota encima, en vez de quedar metido en un pie aparte.
 */
export function BottomActionBar({
  label,
  disabled = false,
  transparent = false,
  onPress,
  onHeight,
}: BottomActionBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleLayout = (event: LayoutChangeEvent) => {
    onHeight?.(event.nativeEvent.layout.height);
  };

  return (
    <View
      onLayout={onHeight == null ? undefined : handleLayout}
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + spacing.md },
        transparent
          ? styles.barTransparent
          : { backgroundColor: colors.background, borderTopColor: colors.border },
      ]}
    >
      <PushButton
        variant="solid"
        tone="secondary"
        size="compact"
        label={label}
        labelStyle={typography.headerTitle}
        fullWidth
        disabled={disabled}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    // Por encima de la hoja de corrección, que se desliza justo detrás.
    zIndex: 2,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
    padding: spacing.md,
  },
  barTransparent: {
    backgroundColor: 'transparent',
  },
});
