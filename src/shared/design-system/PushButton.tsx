import { useCallback } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { hapticPressIn, hapticPressOut } from '@/shared/haptics';
import { elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

export type PushButtonVariant = 'solid' | 'selectable';

interface PushButtonProps {
  label: string;
  /** Segunda línea opcional (p. ej. el número de grado bajo la nota). */
  sublabel?: string;
  onPress: () => void;
  /**
   * `solid` = botón "entero" de Duolingo: color fijo (aun en oscuro), sin
   * estado seleccionado. `selectable` = botón "transparente" que cambia a color
   * de marca al seleccionarse.
   */
  variant?: PushButtonVariant;
  /** Solo aplica a `selectable`. */
  selected?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  minWidth?: number;
  fullWidth?: boolean;
  /** Estilo del texto (tamaño/peso). El color lo fija el botón según el tema. */
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Botón estilo Duolingo con "labio" inferior 3D.
 *
 * El labio (más oscuro) mide `elevation.buttonLip` en reposo. Al presionar, la
 * cara baja exactamente esa distancia de forma **instantánea** (sin animación),
 * de modo que el labio desaparece y el botón se ve "hundido". Al soltar, la cara
 * vuelve con un "pop" animado corto. La háptica se dispara al presionar y al
 * soltar.
 */
export function PushButton({
  label,
  sublabel,
  onPress,
  variant = 'solid',
  selected = false,
  disabled = false,
  accessibilityLabel,
  minWidth,
  fullWidth,
  labelStyle,
  style,
}: PushButtonProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);

  const faceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePressIn = useCallback(() => {
    // Snap instantáneo hacia abajo: asignación directa, sin withTiming.
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    translateY.value = elevation.buttonLip;
    hapticPressIn();
  }, [translateY]);

  const handlePressOut = useCallback(() => {
    // Retorno instantáneo también: sin animación de "soltado" en ningún botón.
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    translateY.value = 0;
    hapticPressOut();
  }, [translateY]);

  const isSolid = variant === 'solid';
  const isSelected = variant === 'selectable' && selected;

  const faceColor = isSolid || isSelected ? (isSolid ? colors.brand : colors.brandTint) : colors.surface;
  const lipColor = isSolid || isSelected ? colors.brandShadow : colors.surfaceShadow;
  const borderColor = isSolid ? 'transparent' : isSelected ? colors.brand : colors.border;
  const labelColor = isSolid ? colors.textOnBrand : isSelected ? colors.brandText : colors.textPrimary;
  const sublabelColor = isSolid
    ? colors.textOnBrand
    : isSelected
      ? colors.brandText
      : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: variant === 'selectable' ? selected : undefined, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        minWidth != null && { minWidth },
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* Labio inferior: caja desplazada hacia abajo que asoma bajo la cara. */}
      <View style={[styles.lip, { backgroundColor: lipColor }]} />
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: faceColor, borderColor, borderWidth: isSolid ? 0 : 2 },
          faceAnimatedStyle,
        ]}
      >
        <Text style={[typography.chip, labelStyle, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        {sublabel != null && (
          <Text style={[styles.sublabel, { color: sublabelColor }]} numberOfLines={1}>
            {sublabel}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: elevation.buttonLip,
    bottom: 0,
    borderRadius: radii.md,
  },
  face: {
    // El margen reserva el alto del labio; translateY lo ocupa al presionar.
    marginBottom: elevation.buttonLip,
    zIndex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sublabel: {
    ...typography.caption,
  },
});
