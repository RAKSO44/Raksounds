import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Header, SectionCard } from '@/shared/design-system';
import { spacing, typography, useTheme } from '@/shared/theme';

import { CreditLink } from './components';

/**
 * Pantalla de créditos. Además de dar crédito a quien corresponde, cumple la
 * atribución que EXIGE la licencia CC BY de las muestras de piano: hay que
 * nombrar al autor, enlazar la licencia e indicar que se modificaron. El texto
 * de referencia vive en `docs/credits/credits.md`.
 */
export function CreditsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Créditos" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard icon="account-music" title="Creación de la app">
          <View style={styles.block}>
            <CreditLink
              label="Oscar Alonso Cruzalegui Castillo"
              url="mailto:oscarcruzaleguicastillo@gmail.com"
            />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Diseño, desarrollo y dirección musical de Raksound.
            </Text>
          </View>
        </SectionCard>

        <SectionCard icon="message-text" title="Mensaje del autor">
          <View style={styles.block}>
            <Text style={[styles.body, { color: colors.textPrimary }]}>
              Esta app fue pensada para el uso del ensamble de AdhaC. El único propósito que tiene
              es poder servir mejor al Padre en esta gracia llamada alabanza.
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Cristo es suficiente. Cristo te ama. Está bien servir como si fueras amado.
            </Text>
          </View>
        </SectionCard>

        <SectionCard icon="piano" title="Sonidos">
          <View style={styles.block}>
            <Text style={[styles.body, { color: colors.textPrimary }]}>
              Muestras de piano: Salamander Grand Piano (Yamaha C5), grabado por Alexander Holm.
            </Text>
            <CreditLink
              label="Licencia CC BY 3.0"
              url="https://creativecommons.org/licenses/by/3.0/"
            />
            <CreditLink
              label="Fuente original de las muestras"
              url="https://sfzinstruments.github.io/pianos/salamander/"
            />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Las muestras fueron modificadas: se completó la escala cromática por resampleo, se
              subió su ganancia y se recortó su duración.
            </Text>
          </View>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  block: {
    gap: spacing.md,
  },
  body: {
    ...typography.subtitle,
    // Los créditos son párrafos, no etiquetas: necesitan interlineado de texto
    // corrido para leerse cómodos.
    lineHeight: 24,
  },
});
