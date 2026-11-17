import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PushButton } from '@/shared/design-system';
import { controls, spacing, typography, useTheme } from '@/shared/theme';

interface TheoryPagerProps {
  /** Página actual, desde 0. */
  page: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  /** En la última página la flecha pasa a ser un check que da la teoría por leída. */
  onFinish: () => void;
}

/**
 * Pie de la teoría: ← número →, como pasar las hojas de un cuaderno. Nunca
 * bloquea: se avanza y se retrocede libremente, y en la última hoja el check
 * cierra la teoría.
 */
export function TheoryPager({ page, total, onPrevious, onNext, onFinish }: TheoryPagerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isFirst = page === 0;
  const isLast = page === total - 1;

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border },
      ]}
    >
      {isFirst ? (
        <View style={styles.button} />
      ) : (
        <PushButton
          variant="selectable"
          size="compact"
          icon="arrow-left"
          accessibilityLabel="Página anterior"
          style={styles.button}
          onPress={onPrevious}
        />
      )}
      <Text
        accessibilityLabel={`Página ${page + 1} de ${total}`}
        style={[styles.number, { color: colors.textSecondary }]}
      >
        {page + 1}
      </Text>
      <PushButton
        variant="solid"
        size="compact"
        icon={isLast ? 'check-bold' : 'arrow-right'}
        accessibilityLabel={isLast ? 'Terminar teoría' : 'Página siguiente'}
        style={styles.button}
        onPress={isLast ? onFinish : onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  button: {
    width: controls.moduleCardButtonWidth,
  },
  number: {
    ...typography.headerTitle,
    flexShrink: 0,
  },
});
