import { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PushButton, PushButtonTone } from '@/shared/design-system';
import { controls, motion, spacing, typography, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface NoteKeyProps {
  /** Texto de la cara: la nota ("G4") o el "?" mientras está oculta. */
  label?: string;
  /**
   * Ícono en vez de (o además de) texto: para una tecla que no debe delatar sus
   * notas, como la del acorde que hay que analizar.
   */
  icon?: IconName;
  /** Rótulo bajo la tecla ("Nota base", "Nota a adivinar"). */
  caption: string;
  tone?: PushButtonTone;
  disabled?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onRelease: () => void;
}

/**
 * Tecla grande de un ejercicio: suena al TOCARLA (no al soltarla) y se puede
 * pulsar tantas veces como haga falta, igual que en la Librería.
 *
 * La cara se remonta cuando cambia el texto (`key={label}`), de modo que
 * revelar la nota oculta entra con un fundido corto en vez de aparecer de
 * golpe.
 */
export function NoteKey({
  label,
  icon,
  caption,
  tone = 'brand',
  disabled,
  accessibilityLabel,
  onPress,
  onRelease,
}: NoteKeyProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Animated.View key={label ?? icon} entering={FadeIn.duration(motion.enter)}>
        <PushButton
          variant="solid"
          tone={tone}
          label={label}
          icon={icon}
          labelStyle={typography.noteLarge}
          minWidth={controls.noteTileSize}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          onPressIn={onPress}
          onPressOut={onRelease}
        />
      </Animated.View>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  caption: {
    ...typography.caption,
  },
});
