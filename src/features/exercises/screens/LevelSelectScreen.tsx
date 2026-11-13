import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EXERCISE_LEVELS, parseExerciseMode } from '@/domain/ear-training';
import { Header } from '@/shared/design-system';
import { spacing, useTheme } from '@/shared/theme';

import { MODE_LABELS } from '../labels';
import { BottomActionBar, LevelOption } from '../components';

/**
 * Elección de dificultad. Los niveles son acumulativos, así que cada fila
 * muestra qué intervalos AÑADE respecto al anterior.
 *
 * El botón de empezar sigue deshabilitado (gris, sin gesto) hasta que hay un
 * nivel elegido: es el mismo contrato del "Continuar" de una lección.
 */
export function LevelSelectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [selected, setSelected] = useState<number | null>(null);

  // Un modo desconocido en la ruta (enlace viejo o escrito a mano) cae en el
  // combinado en vez de dejar la pantalla sin título ni destino.
  const mode = parseExerciseMode(params.mode) ?? 'mixed';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={MODE_LABELS[mode]} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {EXERCISE_LEVELS.map((level) => (
          <LevelOption
            key={level.number}
            level={level}
            selected={selected === level.number}
            onSelect={() => setSelected(level.number)}
          />
        ))}
      </ScrollView>

      <BottomActionBar
        label="Confirmar"
        disabled={selected === null}
        onPress={() => {
          if (selected === null) return;
          router.push({
            pathname: '/exercise/round',
            params: { mode, level: String(selected) },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
