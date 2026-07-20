import { ComponentProps, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticPressIn, hapticPressOut } from '@/shared/haptics';
import { elevation, radii, spacing, typography, useTheme } from '@/shared/theme';

export type PushButtonVariant = 'solid' | 'selectable';

/**
 * Cuánto puede moverse el dedo sin que el gesto se cancele, en px.
 *
 * Es holgado para que un dedo que se reacomoda sobre una tecla no la corte,
 * pero finito a propósito: al superarlo el gesto se cancela y el ScrollView de
 * la pantalla toma el control, de modo que arrastrar sigue haciendo scroll en
 * vez de quedarse pulsando el botón.
 */
const PRESS_SLOP = 20;

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PushButtonProps {
  label: string;
  /** Segunda línea opcional (p. ej. el número de grado bajo la nota). */
  sublabel?: string;
  /** Ícono opcional encima del label (toma el color del texto del botón). */
  icon?: IconName;
  /** Se dispara al SOLTAR, solo si el gesto no se canceló (tap completo). */
  onPress?: () => void;
  /**
   * Se dispara en cuanto el dedo toca el botón. Para acciones que deben sentirse
   * inmediatas (una tecla de piano) en vez de esperar al soltado.
   */
  onPressIn?: () => void;
  /** Se dispara al levantar el dedo o al cancelarse el gesto. Siempre corre. */
  onPressOut?: () => void;
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
 *
 * El gesto va con react-native-gesture-handler y NO con `Pressable`, porque el
 * sistema de responders de React Native concede el toque a UN solo componente a
 * la vez: con `Pressable` era imposible mantener dos botones pulsados (se veía
 * como "solo me deja tocar una nota"). Los reconocedores de gesture-handler son
 * independientes por vista, así que cada dedo maneja su propio botón y la
 * pulsación simultánea de varias notas funciona.
 */
export function PushButton({
  label,
  sublabel,
  icon,
  onPress,
  onPressIn,
  onPressOut,
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
    onPressIn?.();
  }, [translateY, onPressIn]);

  const handlePressOut = useCallback(() => {
    // Retorno instantáneo también: sin animación de "soltado" en ningún botón.
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    translateY.value = 0;
    hapticPressOut();
    onPressOut?.();
  }, [translateY, onPressOut]);

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        // minDuration(0) hace que se active al tocar, no tras una espera: es lo
        // que da el note-on inmediato de una tecla.
        .minDuration(0)
        // Sin límite de duración: la tecla puede mantenerse pulsada indefinidamente.
        .maxDistance(PRESS_SLOP)
        .enabled(!disabled)
        // Los callbacks corren en el hilo de JS, que es donde viven el motor de
        // audio y la háptica.
        .runOnJS(true)
        .onStart(handlePressIn)
        // `success` es false si el dedo salió del botón: ahí no cuenta como tap.
        .onEnd((_event, success) => {
          if (success) onPress?.();
        })
        // Corre siempre (soltado o cancelación), así una nota nunca se queda
        // sonando porque el gesto se interrumpió.
        .onFinalize(handlePressOut),
    [handlePressIn, handlePressOut, onPress, disabled],
  );

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
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ selected: variant === 'selectable' ? selected : undefined, disabled }}
        accessibilityLabel={accessibilityLabel ?? label}
        // El lector de pantalla no distingue press-in de press-out: activar
        // equivale a un tap completo (pulsar y soltar).
        onAccessibilityTap={() => {
          if (disabled) return;
          onPressIn?.();
          onPress?.();
          onPressOut?.();
        }}
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
          {icon != null && <MaterialCommunityIcons name={icon} size={26} color={labelColor} />}
          <Text style={[typography.chip, labelStyle, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
          {sublabel != null && (
            <Text style={[styles.sublabel, { color: sublabelColor }]} numberOfLines={1}>
              {sublabel}
            </Text>
          )}
        </Animated.View>
      </View>
    </GestureDetector>
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
