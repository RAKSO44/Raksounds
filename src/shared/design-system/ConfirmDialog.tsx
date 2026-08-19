import { Modal, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { radii, spacing, typography, useTheme } from '@/shared/theme';

import { PushButton } from './PushButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Texto del botón que confirma la acción (el destructivo). */
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** Cancelar o pedir cerrar el diálogo (backdrop, botón atrás del sistema). */
  onCancel: () => void;
}

/**
 * Diálogo de confirmación para una acción que se pierde si se hace sin querer
 * (abandonar una ronda a medias). Va sobre el `Modal` nativo para que se dibuje
 * por encima de cualquier pantalla, y su botón atrás del sistema equivale a
 * cancelar: volver a pulsar "atrás" devuelve al usuario a donde estaba.
 *
 * Los dos botones son del design system: el destructivo a color entero (rojo) y
 * el de quedarse como selector neutro, para que la opción segura no compita.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* El Modal se dibuja en su propia ventana nativa, fuera del árbol de la
          app: los gestos de `PushButton` necesitan aquí su propia raíz. */}
      <GestureHandlerRootView style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <PushButton
              variant="selectable"
              label={cancelLabel}
              style={styles.action}
              size="compact"
              onPress={onCancel}
            />
            <PushButton
              variant="solid"
              tone="danger"
              label={confirmLabel}
              style={styles.action}
              size="compact"
              onPress={onConfirm}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  title: {
    ...typography.headerTitle,
  },
  message: {
    ...typography.subtitle,
  },
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
