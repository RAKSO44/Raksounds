import { useId } from 'react';
import Svg, { ClipPath, Defs, G, Line, Rect } from 'react-native-svg';

import { QUARTER_UNITS, RhythmItem, sounds } from '@/domain/rhythm';
import { controls, useTheme } from '@/shared/theme';

const HEIGHT = controls.durationBarHeight;
const STROKE = controls.durationBarStroke;

interface DurationBarProps {
  items: readonly RhythmItem[];
  /** Lo que mide la barra, en semicorcheas (la misma que su línea rítmica). */
  capacity: number;
  /** Ancho en píxeles. */
  width: number;
}

/**
 * Cuánto dura lo que SUENA, debajo de su línea rítmica: una barra partida en
 * pulsos (una negra cada uno) donde cada sonido se raya del largo que dura.
 * Lo que vale la figura va en gris y lo que la PROLONGA (el puntillo, la nota
 * ligada) en rojo; los silencios quedan vacíos. Cada sonido empieza con una
 * raya firme: ahí se toca.
 */
export function DurationBar({ items, capacity, width }: DurationBarProps) {
  const { colors } = useTheme();
  const clipId = `duration-${useId().replace(/:/g, '')}`;
  const unit = width / capacity;
  const heard = sounds(items);
  const radius = HEIGHT / 2;

  return (
    <Svg width={width} height={HEIGHT}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={0} width={width} height={HEIGHT} rx={radius} ry={radius} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        {heard.flatMap((sound) =>
          sound.parts.map((part) => {
            const x0 = part.start * unit;
            const x1 = (part.start + part.units) * unit;
            const ink = part.prolongation ? colors.prolongation : colors.textSecondary;
            return (
              <G key={`${part.start}`}>
                <Rect
                  x={x0}
                  y={0}
                  width={x1 - x0}
                  height={HEIGHT}
                  fill={part.prolongation ? colors.prolongationTint : colors.surfaceShadow}
                />
                {hatch(x0, x1).map(([ax, ay, bx, by], index) => (
                  <Line
                    key={index}
                    x1={ax}
                    y1={ay}
                    x2={bx}
                    y2={by}
                    stroke={ink}
                    strokeWidth={controls.durationBarHatchStroke}
                  />
                ))}
              </G>
            );
          }),
        )}
        {/* Un pulso (una negra) por tramo. */}
        {Array.from({ length: Math.ceil(capacity / QUARTER_UNITS) - 1 }, (_, index) => {
          const x = (index + 1) * QUARTER_UNITS * unit;
          return (
            <Line
              key={`pulse-${index}`}
              x1={x}
              y1={0}
              x2={x}
              y2={HEIGHT}
              stroke={colors.border}
              strokeWidth={STROKE}
            />
          );
        })}
        {heard.map((sound) => {
          const x = Math.max(STROKE / 2, sound.start * unit);
          return (
            <Line
              key={`attack-${sound.start}`}
              x1={x}
              y1={0}
              x2={x}
              y2={HEIGHT}
              stroke={colors.textPrimary}
              strokeWidth={STROKE}
            />
          );
        })}
      </G>
      <Rect
        x={STROKE / 2}
        y={STROKE / 2}
        width={width - STROKE}
        height={HEIGHT - STROKE}
        rx={radius - STROKE / 2}
        ry={radius - STROKE / 2}
        fill="none"
        stroke={colors.border}
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

/**
 * Rayas a 45° ("/") dentro del tramo [x0, x1] de la barra: cada raya va de
 * abajo a la izquierda hacia arriba a la derecha, recortada a los bordes del
 * tramo (sin máscaras: es solo recortar un segmento).
 */
function hatch(x0: number, x1: number): [number, number, number, number][] {
  const gap = controls.durationBarHatchGap;
  const lines: [number, number, number, number][] = [];
  // La raya que nace abajo en `t` llega arriba en `t + HEIGHT`.
  for (let t = Math.floor((x0 - HEIGHT) / gap) * gap; t < x1; t += gap) {
    const from = Math.max(t, x0);
    const to = Math.min(t + HEIGHT, x1);
    if (to <= from) continue;
    lines.push([from, HEIGHT - (from - t), to, HEIGHT - (to - t)]);
  }
  return lines;
}
