import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { useTheme } from '@/shared/theme';

/** Cuerpo de la manzana (dos lóbulos arriba, base más estrecha), en una caja de 24. */
const BODY =
  'M12 7.6 C10.6 6.5 8.5 6.2 6.9 7 C4.3 8.2 3.3 11.4 4.1 14.6 C4.9 18 7.3 21 9.5 21.3 ' +
  'C10.5 21.4 11.2 20.9 12 20.9 C12.8 20.9 13.5 21.4 14.5 21.3 C16.7 21 19.1 18 19.9 14.6 ' +
  'C20.7 11.4 19.7 8.2 17.1 7 C15.5 6.2 13.4 6.5 12 7.6 Z';
const STEM = 'M11.9 7.8 C11.9 6.2 12.3 4.6 13.3 3.4';
const LEAF = 'M13 5.6 C14 3.4 16.7 2.6 18.6 3.4 C17.8 5.6 15.4 6.8 13 5.6 Z';
/** Lo que el cuerpo se levanta sobre su labio (el relieve de los botones). */
const LIP = 1.4;

/**
 * Una manzana dibujada en vectores, con el labio inferior de los botones
 * de la app: se lee como una ficha, no como un emoji.
 */
export function Apple({ size }: { size: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={STEM}
        stroke={colors.appleStem}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path d={LEAF} fill={colors.appleLeaf} />
      <Path d={BODY} fill={colors.appleShadow} />
      <G transform={`translate(0 -${LIP})`}>
        <Path d={BODY} fill={colors.apple} />
      </G>
      <Ellipse
        cx={7.6}
        cy={11.2}
        rx={1.1}
        ry={2}
        transform="rotate(25 7.6 11.2)"
        fill={colors.appleShine}
      />
    </Svg>
  );
}
