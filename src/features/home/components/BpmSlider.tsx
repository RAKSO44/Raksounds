import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { BPM_RANGE, bpmAtFraction, bpmFraction, clampBpm } from '@/domain/lessons';
import { hapticPressIn } from '@/shared/haptics';
import { controls, radii, useTheme } from '@/shared/theme';

interface BpmSliderProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

/**
 * Barra para elegir el tempo, al estilo de los sliders de Material 3: el
 * canal grueso se parte en dos a la altura del tirador (una barra vertical
 * con un hueco a cada lado). A la izquierda, el tramo recorrido en morado; a
 * la derecha, el que falta en morado tenue, con un punto que marca el final.
 * Se arrastra o se toca en cualquier punto; con lector de pantalla, sube y
 * baja de 1 en 1 BPM.
 */
export function BpmSlider({ bpm, onChange }: BpmSliderProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const handle = controls.sliderHandleWidth;
  const gap = controls.sliderHandleGap;
  const track = controls.sliderTrackHeight;
  // El centro del tirador recorre la barra sin salirse por los extremos.
  const travel = Math.max(0, width - handle);
  const center = handle / 2 + bpmFraction(bpm) * travel;
  const activeWidth = Math.max(0, center - handle / 2 - gap);
  const inactiveLeft = center + handle / 2 + gap;
  const inactiveWidth = Math.max(0, width - inactiveLeft);
  // El punto final se esconde cuando el tirador ya casi lo alcanza.
  const showStop = inactiveWidth >= track;

  const gesture = useMemo(() => {
    const seek = (x: number) => {
      if (travel === 0 || !Number.isFinite(x)) return;
      onChange(bpmAtFraction((x - handle / 2) / travel));
    };
    return Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onBegin((event) => {
        hapticPressIn();
        seek(event.x);
      })
      .onUpdate((event) => seek(event.x));
  }, [onChange, handle, travel]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tempo"
        accessibilityValue={{
          min: BPM_RANGE.min,
          max: BPM_RANGE.max,
          now: bpm,
          text: `${bpm} BPM`,
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          onChange(clampBpm(bpm + (event.nativeEvent.actionName === 'increment' ? 1 : -1)))
        }
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.slider}
      >
        {activeWidth > 0 && (
          <View
            style={[
              styles.segment,
              styles.active,
              { left: 0, width: activeWidth, backgroundColor: colors.brand },
            ]}
          />
        )}
        {inactiveWidth > 0 && (
          <View
            style={[
              styles.segment,
              styles.inactive,
              { left: inactiveLeft, width: inactiveWidth, backgroundColor: colors.brandTint },
            ]}
          >
            {showStop && <View style={[styles.stop, { backgroundColor: colors.brand }]} />}
          </View>
        )}
        <View
          style={[styles.handle, { left: center - handle / 2, backgroundColor: colors.brand }]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  slider: {
    height: controls.sliderHandleHeight,
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    top: (controls.sliderHandleHeight - controls.sliderTrackHeight) / 2,
    height: controls.sliderTrackHeight,
    justifyContent: 'center',
  },
  // Por fuera, extremos de píldora; hacia el tirador, apenas redondeados.
  active: {
    borderTopLeftRadius: radii.pill,
    borderBottomLeftRadius: radii.pill,
    borderTopRightRadius: controls.sliderInnerRadius,
    borderBottomRightRadius: controls.sliderInnerRadius,
  },
  inactive: {
    alignItems: 'flex-end',
    paddingRight: (controls.sliderTrackHeight - controls.sliderStopSize) / 2,
    borderTopLeftRadius: controls.sliderInnerRadius,
    borderBottomLeftRadius: controls.sliderInnerRadius,
    borderTopRightRadius: radii.pill,
    borderBottomRightRadius: radii.pill,
  },
  stop: {
    width: controls.sliderStopSize,
    height: controls.sliderStopSize,
    borderRadius: radii.pill,
  },
  handle: {
    position: 'absolute',
    top: 0,
    width: controls.sliderHandleWidth,
    height: controls.sliderHandleHeight,
    borderRadius: radii.pill,
  },
});
