import { ComponentProps, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticPressIn } from '@/shared/haptics';
import {
  controls,
  elevation,
  radii,
  spacing,
  ThemeColors,
  typography,
  useTheme,
} from '@/shared/theme';

export type PushButtonVariant = 'solid' | 'selectable';

/**
 * Familia de color del botón. `brand` (morado) es la de siempre; el resto son
 * los roles semánticos que necesitan los ejercicios (acierto, error, aviso) y
 * el celeste secundario. El tono NO cambia la forma del botón, solo su color.
 */
export type PushButtonTone = 'brand' | 'secondary' | 'success' | 'danger' | 'warning';

/** Colores que aporta cada tono, resueltos desde el tema activo. */
interface ToneColors {
  /** Cara del botón sólido. */
  face: string;
  /** Labio 3D. */
  lip: string;
  /** Cara tenue de un `selectable` seleccionado. */
  tint: string;
  /** Texto de un `selectable` seleccionado. */
  text: string;
  /** Texto sobre la cara sólida. */
  onFace: string;
}

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
  /**
   * Texto de la cara. Es opcional porque hay botones que solo son un ícono
   * (las opciones sonoras de un ejercicio, que no deben delatar su nota).
   */
  label?: string;
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
  /** Familia de color. Por defecto, el morado de marca. */
  tone?: PushButtonTone;
  /**
   * Solo aplica a `selectable`: pinta el botón del color del tono. Un `solid`
   * ya va a color entero y NO tiene estado de selección.
   */
  selected?: boolean;
  /**
   * Deshabilitado estilo Duolingo: cara gris plana, sin labio y sin gesto.
   * No es un botón "atenuado": es un botón que aún no está disponible.
   */
  disabled?: boolean;
  /**
   * `center` apila label y sublabel (teclas, opciones). `spread` los reparte en
   * una fila —label a la izquierda, sublabel a la derecha—, que es la forma de
   * una fila de nivel ("NIVEL 1" / "8ª justa y 5ª justa").
   */
  align?: 'center' | 'spread';
  /**
   * Dónde va el ícono: encima del texto (por defecto) o a su izquierda, en la
   * misma fila.
   */
  iconPlacement?: 'above' | 'start';
  /**
   * `compact` reduce el alto de la cara. Es para la acción principal fija de
   * abajo, que no necesita el cuerpo de una tarjeta.
   */
  size?: 'regular' | 'compact';
  /**
   * La cara ocupa todo el alto del contenedor. Es para un botón que acompaña a
   * una columna de otros botones y debe llegar de arriba abajo: sin esto la
   * cara mide lo que su texto y el labio asomaría por todo el hueco sobrante.
   */
  fillHeight?: boolean;
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
 * vuelve con un "pop" animado corto. La háptica se dispara SOLO al presionar
 * (un único golpe seco; al soltar no vibra).
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
  tone = 'brand',
  selected = false,
  disabled = false,
  align = 'center',
  size = 'regular',
  iconPlacement = 'above',
  fillHeight = false,
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
    // Sin háptica al soltar: el único golpe seco es el del press-in.
    // eslint-disable-next-line react-hooks/immutability -- mutar .value es la API de shared values de reanimated
    translateY.value = 0;
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

  const iconStart = iconPlacement === 'start';
  const isSolid = variant === 'solid';
  const isSelected = variant === 'selectable' && selected;
  const toneColors = TONES[tone](colors);

  // Un botón deshabilitado no es un botón atenuado: pierde el color, el relieve
  // y el gesto, como el "Continuar" de Duolingo antes de elegir respuesta.
  const faceColor = disabled
    ? colors.disabledSurface
    : isSolid
      ? toneColors.face
      : isSelected
        ? toneColors.tint
        : colors.surface;
  const lipColor = disabled
    ? colors.disabledSurface
    : isSolid || isSelected
      ? toneColors.lip
      : colors.surfaceShadow;
  const labelColor = disabled
    ? colors.disabledText
    : isSolid
      ? toneColors.onFace
      : isSelected
        ? toneColors.text
        : colors.textPrimary;
  const sublabelColor = disabled
    ? colors.disabledText
    : isSolid
      ? toneColors.onFace
      : isSelected
        ? toneColors.text
        : colors.textSecondary;
  // Un sólido no lleva borde (su color ya es la cara), pero se reserva
  // transparente para que el grosor no cambie el tamaño entre variantes.
  const borderColor = isSolid
    ? 'transparent'
    : disabled
      ? colors.disabledSurface
      : isSelected
        ? toneColors.face
        : colors.border;

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
          style,
        ]}
      >
        {/* Labio inferior: caja desplazada hacia abajo que asoma bajo la cara. */}
        <View style={[styles.lip, { backgroundColor: lipColor }]} />
        <Animated.View
          style={[
            styles.face,
            fillHeight && styles.faceFill,
            size === 'compact' && styles.faceCompact,
            iconStart && styles.faceRow,
            { backgroundColor: faceColor, borderColor, borderWidth: isSolid ? 0 : 2 },
            faceAnimatedStyle,
          ]}
        >
          {icon != null && <MaterialCommunityIcons name={icon} size={26} color={labelColor} />}
          <View
            style={[
              styles.texts,
              iconStart && styles.textsStart,
              align === 'spread' && styles.textsSpread,
            ]}
          >
            {label != null && label !== '' && (
              <Text style={[typography.chip, styles.label, labelStyle, { color: labelColor }]}>
                {label}
              </Text>
            )}
            {sublabel != null && (
              <Text
                style={[
                  styles.sublabel,
                  align === 'spread' && styles.sublabelSpread,
                  { color: sublabelColor },
                ]}
              >
                {sublabel}
              </Text>
            )}
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/**
 * Cada tono resuelve sus colores desde el tema. Se define fuera del componente
 * porque es una tabla, no estado: el tono solo elige qué roles leer.
 */
const TONES: Record<PushButtonTone, (colors: ThemeColors) => ToneColors> = {
  brand: (colors) => ({
    face: colors.brand,
    lip: colors.brandShadow,
    tint: colors.brandTint,
    text: colors.brandText,
    onFace: colors.textOnBrand,
  }),
  secondary: (colors) => ({
    face: colors.secondary,
    lip: colors.secondaryShadow,
    tint: colors.secondaryTint,
    text: colors.secondaryText,
    onFace: colors.textOnBrand,
  }),
  success: (colors) => ({
    face: colors.success,
    lip: colors.successShadow,
    tint: colors.successTint,
    text: colors.successText,
    onFace: colors.textOnBrand,
  }),
  danger: (colors) => ({
    face: colors.danger,
    lip: colors.dangerShadow,
    tint: colors.dangerTint,
    text: colors.dangerText,
    onFace: colors.textOnBrand,
  }),
  warning: (colors) => ({
    face: colors.warning,
    lip: colors.warningShadow,
    tint: colors.warningTint,
    text: colors.warningText,
    // El blanco no tiene contraste sobre amarillo; ahí el texto va oscuro.
    onFace: colors.textOnWarning,
  }),
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
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
  faceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  texts: {
    alignItems: 'center',
    gap: spacing.xs,
    // El texto manda sobre el tamaño de la caja: NUNCA se encoge (y por tanto
    // nunca se recorta ni sale con puntos suspensivos).
    flexShrink: 0,
  },
  textsStart: {
    flex: 1,
    alignItems: 'flex-start',
  },
  textsSpread: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faceFill: {
    flex: 1,
  },
  faceCompact: {
    paddingVertical: controls.compactButtonPaddingY,
  },
  label: {
    textAlign: 'center',
  },
  sublabel: {
    ...typography.caption,
  },
  sublabelSpread: {
    ...typography.chip,
    // En una fila, el sublabel es el dato de la derecha: se le deja repartir el
    // espacio con el título (envolviendo si hace falta, nunca recortando).
    flexShrink: 1,
    textAlign: 'right',
  },
});
