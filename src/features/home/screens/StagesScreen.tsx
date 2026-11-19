import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { STAGES } from '@/domain/lessons';
import { Header } from '@/shared/design-system';
import { controls, spacing, useTheme } from '@/shared/theme';

import { StageRow } from '../components/StageRow';
import { useStageSelectionStore } from '../stageSelection';

/**
 * Todas las etapas del roadmap, para saltar a cualquiera. Se abre al tocar la
 * tarjeta de etapa del Home (`?current=` = la etapa en curso, que va
 * resaltada); elegir una vuelve al Home, que se coloca en esa etapa.
 */
export function StagesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { current } = useLocalSearchParams<{ current?: string }>();
  const currentIndex = Number(current ?? 0);
  const select = useStageSelectionStore((state) => state.select);

  const choose = (index: number) => {
    select(index);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Etapas" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {STAGES.map((stage, index) => (
          <StageRow
            key={stage.number}
            stage={stage}
            current={index === currentIndex}
            onPress={() => choose(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: controls.pathMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
