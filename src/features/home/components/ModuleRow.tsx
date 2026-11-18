import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PathModule } from '@/domain/lessons';
import { PRESS_SLOP, PushButtonTone, resolveTone } from '@/shared/design-system';
import { hapticPressIn } from '@/shared/haptics';
import { controls, elevation, motion, radii, spacing, typography, useTheme } from '@/shared/theme';

import { NodeStatus, useStatusTransition } from '../hooks/useStatusTransition';
import { moduleIcon } from '../labels';
import { ModuleCardContent } from './ModuleCardContent';

const D = controls.moduleNodeSize;
/** Borde de la tarjeta abierta (el círculo sólido no lleva). */
const BORDER = 2;
const MORPH = { duration: motion.morph, easing: Easing.out(Easing.cubic) };
/**
 * Un dedo que se queda apoyado sigue contando como toque (el `Tap` de
 * gesture-handler falla por defecto a los 500 ms).
 */
const HOLD_LIMIT_MS = 10_000;

/**
 * 1 → 0 en el primer tramo `end` del morph. Es un worklet porque se llama
 * desde los `useAnimatedStyle` (hilo de UI): una función JS normal ahí revienta
 * la app en el dispositivo ("Tried to synchronously call a Remote Function"),
 * y en Jest no se nota porque reanimated está mockeado.
 */
function fadeOut(value: number, end: number): number {
  'worklet';
  return interpolate(value, [0, end], [1, 0], Extrapolation.CLAMP);
}

interface ModuleRowProps {
  module: PathModule;
  /** Color de la etapa del módulo (círculo, etiqueta y botones). */
  tone: PushButtonTone;
  open: boolean;
  theoryDone: boolean;
  practiceDone: boolean;
  /** El Home está a la vista: los cambios de estado solo se animan entonces. */
  visible: boolean;
  /** Tocar el círculo (o su título) o, abierto, el temario. */
  onToggle: () => void;
  onTheory: () => void;
  onPractice: () => void;
}

/**
 * Un módulo de la ruta. Cerrado es un círculo con relieve y su título al lado;
 * al tocarlo, el MISMO círculo se estira hasta ser una tarjeta con el temario
 * y las entradas de Teoría y Práctica (y al tocar el temario vuelve a círculo).
 *
 * El color del círculo cuenta el progreso: el labio se vuelve dorado al leer
 * la teoría y la cara al completar la práctica. Un módulo sin lección es
 * neutro y su toque lo decide la pantalla (el aviso de "Próximamente").
 *
 * Nada crece por escala: la forma cambia de ANCHO y ALTO (como el micrófono),
 * y el contenido nunca cambia a la vez que la forma: el ícono se va al empezar
 * y el temario entra al final, con un desplazamiento corto hacia arriba.
 */
export function ModuleRow({
  module,
  tone,
  open,
  theoryDone,
  practiceDone,
  visible,
  onToggle,
  onTheory,
  onPractice,
}: ModuleRowProps) {
  const { colors } = useTheme();
  const stage = resolveTone(tone, colors);
  const upcoming = module.lessonId === null;
  const status = useStatusTransition({ theory: theoryDone, practice: practiceDone }, visible);

  const morph = useSharedValue(0);
  const pressed = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const cardHeight = useSharedValue(0);
  // El temario existe mientras el módulo está abierto o cerrándose; se mide
  // al montarse y solo entonces empieza a estirarse la forma.
  const [mounted, setMounted] = useState(open);
  const [measured, setMeasured] = useState(false);
  // El temario se mide y se pinta al ancho FINAL de la tarjeta, no al de la
  // forma que se está estirando: así el texto no se reacomoda a mitad.
  const [contentWidth, setContentWidth] = useState(0);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      if (measured) morph.value = withTiming(1, MORPH);
      return;
    }
    morph.value = withTiming(0, MORPH, (finished) => {
      if (!finished) return;
      runOnJS(setMounted)(false);
      runOnJS(setMeasured)(false);
    });
  }, [open, measured, morph]);

  const onRowLayout = (event: LayoutChangeEvent) => {
    rowWidth.value = event.nativeEvent.layout.width;
    setContentWidth(event.nativeEvent.layout.width - BORDER * 2);
  };
  const onCardLayout = (event: LayoutChangeEvent) => {
    cardHeight.value = event.nativeEvent.layout.height + BORDER * 2;
    setMeasured(true);
  };

  const faceOf = (s: NodeStatus) =>
    upcoming ? colors.surface : s.practice ? colors.warning : stage.face;
  const lipOf = (s: NodeStatus) =>
    upcoming ? colors.surfaceShadow : s.theory ? colors.warningShadow : stage.lip;
  const iconColorOf = (s: NodeStatus) =>
    upcoming ? colors.textSecondary : s.practice ? colors.textOnWarning : stage.onFace;
  const from = { face: faceOf(status.from), lip: lipOf(status.from) };
  const to = { face: faceOf(status.to), lip: lipOf(status.to) };
  const { surface, surfaceShadow, border, progressShine } = colors;
  const { progress, shine } = status;

  const shellStyle = useAnimatedStyle(() => {
    const lip = interpolate(morph.value, [0, 1], [elevation.nodeLip, elevation.buttonLip]);
    return {
      width: interpolate(morph.value, [0, 1], [D, Math.max(D, rowWidth.value)]),
      height: interpolate(morph.value, [0, 1], [D, Math.max(D, cardHeight.value)]) + lip,
    };
  });
  const lipStyle = useAnimatedStyle(() => ({
    top: interpolate(morph.value, [0, 1], [elevation.nodeLip, elevation.buttonLip]),
    borderRadius: interpolate(morph.value, [0, 1], [D / 2, radii.lg]),
    backgroundColor: interpolateColor(
      morph.value,
      [0, 1],
      [interpolateColor(progress.value, [0, 1], [from.lip, to.lip]), surfaceShadow],
    ),
  }));
  const faceStyle = useAnimatedStyle(() => {
    const lip = interpolate(morph.value, [0, 1], [elevation.nodeLip, elevation.buttonLip]);
    const circleFace = interpolateColor(progress.value, [0, 1], [from.face, to.face]);
    return {
      bottom: lip,
      borderRadius: interpolate(morph.value, [0, 1], [D / 2, radii.lg]),
      backgroundColor: interpolateColor(morph.value, [0, 1], [circleFace, surface]),
      // El círculo sólido "no tiene" borde: lo lleva del color de su cara.
      borderColor: interpolateColor(morph.value, [0, 1], [upcoming ? border : circleFace, border]),
      transform: [{ translateY: pressed.value * lip }],
    };
  });
  const iconFromStyle = useAnimatedStyle(() => ({
    opacity: fadeOut(morph.value, 0.3) * (1 - progress.value),
  }));
  const iconToStyle = useAnimatedStyle(() => ({
    opacity: fadeOut(morph.value, 0.3) * progress.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: fadeOut(morph.value, 0.25) }));
  const contentStyle = useAnimatedStyle(() => {
    const enter = interpolate(morph.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: enter, transform: [{ translateY: (1 - enter) * spacing.sm }] };
  });
  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [0, 0.05, 0.95, 1], [0, 1, 1, 0]) * fadeOut(morph.value, 0.2),
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-D, D]) }, { rotate: '20deg' }],
  }));

  // Un `Tap`, no un `LongPress` que se activa al apoyar el dedo: mientras el
  // dedo no se levanta el toque no se ha "ganado", así que si empieza a
  // arrastrar el ScrollView se lleva el gesto y la ruta hace scroll. La cara
  // se hunde igualmente al apoyar (`onBegin`), como un PushButton.
  const pressGesture = useCallback(
    (): ReturnType<typeof Gesture.Tap> =>
      Gesture.Tap()
        .maxDistance(PRESS_SLOP)
        .maxDuration(HOLD_LIMIT_MS)
        .runOnJS(true)
        .onBegin(() => {
          // Mismo snap instantáneo y misma háptica que un PushButton.
          pressed.value = 1;
          hapticPressIn();
        })
        .onEnd((_event, success) => {
          if (success) onToggle();
        })
        .onFinalize(() => {
          pressed.value = 0;
        }),
    [pressed, onToggle],
  );
  // Un gesto no se puede compartir entre dos detectores: uno por zona.
  const faceGesture = useMemo(() => pressGesture(), [pressGesture]);
  const titleGesture = useMemo(() => pressGesture(), [pressGesture]);

  const label = upcoming
    ? `Módulo ${module.number}: ${module.title}. Próximamente`
    : `Módulo ${module.number}: ${module.title}. ${statusLabel(theoryDone, practiceDone)}`;

  return (
    <View style={styles.row} onLayout={onRowLayout}>
      {/* Toda la franja a la derecha del círculo (de arriba abajo, no solo el
          texto) abre el módulo: es un blanco cómodo para el dedo. */}
      <GestureDetector gesture={titleGesture}>
        <Animated.View
          pointerEvents={open ? 'none' : 'auto'}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[styles.titleArea, titleStyle]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{module.title}</Text>
          {upcoming && (
            <Text style={[styles.soon, { color: colors.textSecondary }]}>Próximamente</Text>
          )}
        </Animated.View>
      </GestureDetector>

      <Animated.View style={shellStyle}>
        <Animated.View style={[styles.lip, lipStyle]} />
        <Animated.View style={[styles.face, faceStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.shine, { backgroundColor: progressShine }, shineStyle]}
          />
          <Animated.View pointerEvents="none" style={[styles.icon, iconFromStyle]}>
            <MaterialCommunityIcons
              name={moduleIcon(module.number)}
              size={34}
              color={iconColorOf(status.from)}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.icon, iconToStyle]}>
            <MaterialCommunityIcons
              name={moduleIcon(module.number)}
              size={34}
              color={iconColorOf(status.to)}
            />
          </Animated.View>

          {mounted && (
            <Animated.View
              onLayout={onCardLayout}
              pointerEvents={open ? 'box-none' : 'none'}
              style={[styles.card, { width: contentWidth }, contentStyle]}
            >
              <ModuleCardContent
                module={module}
                tone={tone}
                theoryDone={theoryDone}
                practiceDone={practiceDone}
                onTheory={onTheory}
                onPractice={onPractice}
              />
            </Animated.View>
          )}

          {/* Zona que abre y cierra: todo el círculo, o el temario si está
              abierto (los botones de la derecha quedan fuera). */}
          <GestureDetector gesture={faceGesture}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={open ? `Cerrar módulo ${module.number}` : label}
              style={[styles.hit, open && styles.hitOpen]}
            />
          </GestureDetector>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function statusLabel(theory: boolean, practice: boolean): string {
  if (theory && practice) return 'Teoría leída y ejercicios completados';
  if (theory) return 'Teoría leída';
  if (practice) return 'Ejercicios completados';
  return 'Sin empezar';
}

/** Lo que ocupa la columna de botones de la derecha, que la zona de cierre no tapa. */
const ACTIONS_WIDTH = controls.moduleCardButtonWidth + spacing.sm * 2;

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
  },
  titleArea: {
    position: 'absolute',
    left: D,
    right: 0,
    top: 0,
    // Alto del círculo con su labio: la fila entera, no solo las letras.
    height: D + elevation.nodeLip,
    paddingLeft: spacing.md,
    justifyContent: 'center',
  },
  title: {
    ...typography.question,
    flexShrink: 0,
  },
  soon: {
    ...typography.sectionLabel,
    flexShrink: 0,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderWidth: BORDER,
    overflow: 'hidden',
  },
  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: D - BORDER * 2,
    height: D - BORDER * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shine: {
    position: 'absolute',
    top: -D / 2,
    left: D / 3,
    width: D / 4,
    height: D * 2,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hitOpen: {
    right: ACTIONS_WIDTH,
  },
});
