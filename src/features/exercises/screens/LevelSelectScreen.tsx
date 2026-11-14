import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { parseExerciseMode } from '@/domain/ear-training';
import { parseSingingKind } from '@/domain/singing';
import { Header } from '@/shared/design-system';
import { spacing, useTheme } from '@/shared/theme';

import { levelRowsFor, MODE_LABELS, SINGING_LABELS } from '../labels';
import { BottomActionBar, LevelOption } from '../components';

/**
 * Elección de dificultad, común a los ejercicios auditivos y a los de
 * entonación: cada modo trae su propia escala de niveles (`levelRowsFor`).
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
  const singingKind = parseSingingKind(params.mode);
  const exerciseMode = parseExerciseMode(params.mode) ?? 'mixed';
  const title = singingKind === null ? MODE_LABELS[exerciseMode] : SINGING_LABELS[singingKind];

  const start = () => {
    if (selected === null) return;
    const level = String(selected);
    if (singingKind !== null) {
      router.push({ pathname: '/exercise/sing', params: { kind: singingKind, level } });
      return;
    }
    router.push({ pathname: '/exercise/round', params: { mode: exerciseMode, level } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={title} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {levelRowsFor(singingKind ?? exerciseMode).map((row) => (
          <LevelOption
            key={row.number}
            number={row.number}
            tier={row.tier}
            summary={row.summary}
            selected={selected === row.number}
            onSelect={() => setSelected(row.number)}
          />
        ))}
      </ScrollView>

      <BottomActionBar label="Confirmar" disabled={selected === null} onPress={start} />
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
