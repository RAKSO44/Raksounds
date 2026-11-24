import { memo, ReactNode, useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { figureById, FigureId, FIGURES } from '@/domain/rhythm';
import { PushButton } from '@/shared/design-system';
import { controls, spacing } from '@/shared/theme';

import { FigurePulse, useFigurePulse } from '../../hooks/useFigurePulse';
import { FigureTile } from '../notation/FigureTile';
import { PulseHeart } from '../PulseHeart';
import { PulseTrace } from '../PulseTrace';
import { DashedBox } from './DashedBox';
import { DashedDivider } from './DashedDivider';
import { InlineTip } from './InlineTip';
import { RichText, TheoryHeading } from './RichText';
import { TheoryBullets } from './TheoryBullets';
import { TipText, useTooltip } from './TooltipHost';

const ANSWER_KEY = 'pulse-answer';
const ANSWER: TipText = [
  'Exacto 😊. ',
  { text: 'El pulso', tone: 'heart' },
  ' es nuestro sistema de tiempo totalmente personalizable.\n',
  'No los segundos, ni los minutos, ni las manzanas.\n',
  { text: '¡Es el pulso!', tone: 'heart' },
];

const ALL_FIGURES: readonly FigureId[] = FIGURES.map((figure) => figure.id);

/**
 * Módulo 3 · Página 3: ¿respecto a qué cuentan las figuras? Respecto al
 * pulso. Se fija "un pulso = una negra" y, con eso, se oye cuánto vale cada
 * figura sobre el pulso.
 */
export function FiguresPulsePage() {
  return (
    <View style={styles.page}>
      <TheoryHeading>¿Respecto a qué cuentan?</TheoryHeading>
      <RichText
        segments={[
          '¡Genial! Ya aprendimos cuánto duran las figuras musicales, y sus valores relativos unas respecto de las otras.',
        ]}
      />
      <RichText
        segments={['Pero seguro te estás preguntando algo... ¿Respecto a qué cuentan? 🤔']}
      />
      <View style={styles.lines}>
        <RichText segments={['Los números cuentan manzanas ', { apple: true }, '.']} />
        <RichText segments={['Las figuras musicales, ¿qué cuentan?']} />
      </View>
      <RichText
        segments={[
          'Para poder contar con estas figuras, necesitamos un sistema de tiempo. Algo que:',
        ]}
      />
      <TheoryBullets items={[['Sea constante'], ['Podamos decidir su velocidad']]} />
      <AnswerHeart />

      <DashedDivider />

      <RichText
        segments={[
          'Aprenderemos a fondo cómo usar este sistema en el módulo "Compases y métrica".',
        ]}
      />
      <RichText segments={['Por ahora, contaremos de la siguiente manera:']} />
      <PulseDemos
        between={
          <>
            <DashedBox>
              <RichText
                segments={['Un pulso = una negra ', { figure: 'quarter' }]}
                strong
                centered
              />
            </DashedBox>
            <RichText
              segments={[
                'Con eso, ¡ya podemos deducir los pulsos que valdrían las demás figuras musicales!',
              ]}
            />
          </>
        }
      />
    </View>
  );
}

/**
 * Los dos reproductores de la hoja y lo que va entre ellos. Sus pulsos viven
 * AQUÍ y no en la página: cada golpe vuelve a pintar solo esta parte, no
 * todos los párrafos (`between` llega ya creado y React no lo repinta).
 */
function PulseDemos({ between }: { between: ReactNode }) {
  const quarter = useFigurePulse('quarter');
  const free = useFigurePulse(null);
  const { stop: stopQuarter, toggle: toggleQuarter } = quarter;
  const { stop: stopFree, toggle: toggleFree } = free;

  // Arrancar uno detiene el otro: el metrónomo es uno solo.
  const playQuarter = useCallback(() => {
    stopFree();
    toggleQuarter();
  }, [stopFree, toggleQuarter]);
  const playFree = useCallback(() => {
    stopQuarter();
    toggleFree();
  }, [stopQuarter, toggleFree]);

  return (
    <>
      <PulseDemo pulse={quarter} label="la negra sobre el pulso" onToggle={playQuarter} />
      {between}
      <View style={styles.freeDemo}>
        <PulseDemo pulse={free} label="la figura elegida sobre el pulso" onToggle={playFree} />
        <FigureChooser selected={free.figure} onChoose={free.choose} />
      </View>
    </>
  );
}

interface PulseDemoProps {
  pulse: FigurePulse;
  /** Lo que suena, para el lector de pantalla ("Escuchar la negra sobre el pulso"). */
  label: string;
  onToggle: () => void;
}

/**
 * Reproducir/pausar junto al oxímetro, alineado con su trazo. Pausar lo
 * detiene del todo: al volver a reproducir arranca desde el pulso fuerte.
 */
function PulseDemo({ pulse, label, onToggle }: PulseDemoProps) {
  return (
    <View style={styles.demo}>
      <PushButton
        variant="solid"
        size="compact"
        icon={pulse.running ? 'pause' : 'play'}
        accessibilityLabel={pulse.running ? 'Detener' : `Escuchar ${label}`}
        disabled={!pulse.ready}
        onPress={onToggle}
      />
      <View style={styles.trace}>
        <PulseTrace beat={pulse.beat} withFigures />
      </View>
    </View>
  );
}

interface FigureChooserProps {
  selected: FigureId | null;
  onChoose: (figure: FigureId | null) => void;
}

/**
 * Las cinco figuras: tocar una la elige y tocarla de nuevo la quita (queda
 * solo el pulso). `memo`: los golpes no la repintan.
 */
const FigureChooser = memo(function FigureChooser({ selected, onChoose }: FigureChooserProps) {
  return (
    <View style={styles.chooser}>
      {ALL_FIGURES.map((figure) => (
        <FigureTile
          key={figure}
          figure={figure}
          space={controls.figureSpaceTile}
          active={selected === figure}
          accessibilityLabel={`${figureById(figure).name} sobre el pulso`}
          onPress={() => onChoose(selected === figure ? null : figure)}
        />
      ))}
    </View>
  );
});

const IDLE_BEAT = { count: 0, accent: false };

/**
 * El corazón del pulso, centrado. Tocarlo da un latido y despliega debajo la
 * respuesta, empujando lo que sigue de la hoja.
 */
function AnswerHeart() {
  const tooltip = useTooltip();
  const anchor = useRef<View>(null);
  const [beat, setBeat] = useState(IDLE_BEAT);

  return (
    <View style={styles.answer}>
      <View ref={anchor} collapsable={false} style={styles.heart}>
        <PulseHeart
          running={false}
          beat={beat}
          accessibilityLabel="Ver la respuesta"
          onToggle={() => {
            setBeat((current) => ({ count: current.count + 1, accent: true }));
            tooltip.toggle(ANSWER_KEY, anchor.current, ANSWER, undefined, { inline: true });
          }}
        />
      </View>
      <InlineTip tipKey={ANSWER_KEY} text={ANSWER} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  lines: {
    gap: spacing.xs,
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trace: {
    flex: 1,
  },
  freeDemo: {
    gap: spacing.md,
  },
  chooser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  answer: {
    // El corazón trae aire arriba para sus "BUM": se sube para que no quede lejos del texto.
    marginTop: -spacing.xl,
  },
  heart: {
    alignSelf: 'center',
  },
});
