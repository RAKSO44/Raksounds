import { RhythmFigure } from './figures';

/**
 * Geometría vectorial de una figura, construida a partir de sus propiedades
 * (cabeza hueca o rellena, plica, corchetes). No hay un dibujo por figura: la
 * misma receta arma las cinco, y una figura nueva (con puntillo, plica hacia
 * abajo…) se dibuja agregando una regla aquí, no una imagen.
 *
 * Todo se mide en ESPACIOS de pentagrama (la distancia entre dos líneas), la
 * unidad de la notación musical: la cabeza ocupa justo un espacio de alto y
 * la plica mide unos tres y medio. Quien la pinta solo decide cuántos píxeles
 * vale un espacio.
 */

/** Cabeza de negra, corchea y semicorchea: un óvalo inclinado hacia arriba. */
const HEAD = { rx: 0.66, ry: 0.47, tilt: -20 } as const;
/** Hueco de la blanca: más fino e inclinado que la cabeza (trazo de pluma). */
const HALF_HOLE = { rx: 0.54, ry: 0.21, tilt: -34 } as const;
/** La redonda: más ancha y sin inclinar, con el hueco oblicuo. */
const WHOLE_HEAD = { rx: 0.86, ry: 0.53, tilt: 0 } as const;
const WHOLE_HOLE = { rx: 0.44, ry: 0.27, tilt: -60 } as const;

/** Plica: grosor, largo desde el centro de la cabeza y extra por cada corchete de más. */
const STEM = { width: 0.16, length: 3.4, extraPerFlag: 0.55 } as const;
/** Separación vertical entre dos corchetes. */
const FLAG_GAP = 0.9;
/**
 * Con varios corchetes cada uno es más corto (se aplasta en vertical): si no,
 * sus curvas se montan y se ven como una sola mancha.
 */
const STACKED_FLAG_SQUASH = 0.68;

interface Ellipse {
  readonly rx: number;
  readonly ry: number;
  /** Inclinación en grados (negativa: sube hacia la derecha). */
  readonly tilt: number;
}

export interface FigureGlyph {
  /** Caja del dibujo, en espacios. */
  readonly width: number;
  readonly height: number;
  /**
   * Centro de la cabeza dentro de la caja: el punto que se apoya en una línea
   * (la de la barra rítmica hoy, la del pentagrama mañana).
   */
  readonly head: { readonly x: number; readonly y: number };
  /** Contornos rellenos (regla even-odd: un óvalo dentro de otro es un hueco). */
  readonly paths: readonly string[];
}

const round = (value: number) => Math.round(value * 1000) / 1000;
const point = (x: number, y: number) => `${round(x)},${round(y)}`;

/** Medio ancho y medio alto de un óvalo inclinado (su caja). */
function extent({ rx, ry, tilt }: Ellipse): { x: number; y: number } {
  const t = (tilt * Math.PI) / 180;
  return {
    x: Math.sqrt(rx ** 2 * Math.cos(t) ** 2 + ry ** 2 * Math.sin(t) ** 2),
    y: Math.sqrt(rx ** 2 * Math.sin(t) ** 2 + ry ** 2 * Math.cos(t) ** 2),
  };
}

/** Un óvalo inclinado como contorno cerrado (dos medios arcos). */
function ellipsePath(cx: number, cy: number, { rx, ry, tilt }: Ellipse): string {
  const t = (tilt * Math.PI) / 180;
  const dx = rx * Math.cos(t);
  const dy = rx * Math.sin(t);
  const arc = (x: number, y: number) => `A${round(rx)},${round(ry)} ${tilt} 1 0 ${point(x, y)}`;
  return `M${point(cx + dx, cy + dy)} ${arc(cx - dx, cy - dy)} ${arc(cx + dx, cy + dy)} Z`;
}

/** La plica: un rectángulo con el extremo de arriba redondeado. */
function stemPath(left: number, top: number, bottom: number): string {
  const r = STEM.width / 2;
  const right = left + STEM.width;
  return [
    `M${point(left, bottom)}`,
    `L${point(left, top + r)}`,
    `A${round(r)},${round(r)} 0 0 1 ${point(right, top + r)}`,
    `L${point(right, bottom)}`,
    'Z',
  ].join(' ');
}

/**
 * Un corchete que cuelga de la plica: sale hacia la derecha, se curva hacia
 * abajo y termina en punta. `(x, y)` es su esquina superior izquierda, sobre
 * la plica; `squash` acorta su caída.
 */
function flagPath(x: number, y: number, squash: number): string {
  const w = STEM.width;
  const p = (dx: number, dy: number) => point(x + dx, y + dy * squash);
  return [
    `M${p(0, 0)}`,
    `L${p(w, 0)}`,
    `C${p(w + 0.12, 0.62)} ${p(w + 0.98, 0.9)} ${p(w + 0.9, 1.98)}`,
    `C${p(w + 0.86, 2.36)} ${p(w + 0.74, 2.62)} ${p(w + 0.56, 2.84)}`,
    `C${p(w + 0.66, 2.42)} ${p(w + 0.7, 1.62)} ${p(0, 0.86)}`,
    'Z',
  ].join(' ');
}

/** Lo que el corchete sobresale a la derecha de la plica (hasta sus puntos de control). */
const FLAG_REACH = 0.98;
/** Lo que baja la punta de un corchete desde donde empieza. */
const FLAG_DROP = 2.84;

/** Construye el dibujo de una figura a partir de sus propiedades. */
export function figureGlyph(figure: RhythmFigure): FigureGlyph {
  const head = figure.stem ? HEAD : WHOLE_HEAD;
  const box = extent(head);

  // Primero todo relativo al centro de la cabeza (0, 0); al final se corre a la caja.
  const shapes: ((dx: number, dy: number) => string)[] = [];
  let minX = -box.x;
  let maxX = box.x;
  let minY = -box.y;
  let maxY = box.y;

  const hole = figure.head === 'hollow' ? (figure.stem ? HALF_HOLE : WHOLE_HOLE) : null;
  shapes.push(
    (dx, dy) => ellipsePath(dx, dy, head) + (hole === null ? '' : ` ${ellipsePath(dx, dy, hole)}`),
  );

  if (figure.stem) {
    // La plica va pegada al borde derecho de la cabeza (plica hacia arriba).
    const stemLeft = box.x - STEM.width;
    const stemTop = -(STEM.length + Math.max(0, figure.flags - 1) * STEM.extraPerFlag);
    shapes.push((dx, dy) => stemPath(stemLeft + dx, stemTop + dy, dy));
    minY = Math.min(minY, stemTop);

    const squash = figure.flags > 1 ? STACKED_FLAG_SQUASH : 1;
    for (let flag = 0; flag < figure.flags; flag++) {
      const flagTop = stemTop + flag * FLAG_GAP;
      shapes.push((dx, dy) => flagPath(stemLeft + dx, flagTop + dy, squash));
      maxX = Math.max(maxX, box.x + FLAG_REACH);
      maxY = Math.max(maxY, flagTop + FLAG_DROP * squash);
    }
  }

  const headX = -minX;
  const headY = -minY;
  return {
    width: round(maxX - minX),
    height: round(maxY - minY),
    head: { x: round(headX), y: round(headY) },
    paths: shapes.map((shape) => shape(headX, headY)),
  };
}

/** Distancia entre los centros de dos cabezas de un grupo unido por barras. */
const BEAMED_NOTE_STEP = 2.4;
/** Barra que une las plicas: grosor y distancia de una barra a la siguiente. */
const BEAM = { thickness: 0.5, step: 0.8 } as const;

/** Una barra horizontal entre dos x, con la parte de arriba en `top`. */
function beamPath(left: number, right: number, top: number): string {
  const bottom = top + BEAM.thickness;
  return `M${point(left, top)} L${point(right, top)} L${point(right, bottom)} L${point(left, bottom)} Z`;
}

/**
 * Varias figuras con corchetes escritas juntas: en vez de un corchete cada
 * una, sus plicas se unen con tantas barras como corchetes tendrían (una la
 * corchea, dos la semicorchea). Se escriben distinto pero duran lo mismo.
 */
export function beamedGlyph(figure: RhythmFigure, count: number): FigureGlyph {
  if (figure.flags === 0 || count < 2) {
    throw new Error(`Solo se unen con barras 2+ figuras con corchetes: ${figure.id} × ${count}`);
  }
  const box = extent(HEAD);
  const stemTop = -(STEM.length + Math.max(0, figure.flags - 1) * STEM.extraPerFlag);
  const stemLefts = Array.from(
    { length: count },
    (_, note) => note * BEAMED_NOTE_STEP + box.x - STEM.width,
  );

  const headX = box.x;
  const headY = -stemTop;
  const paths = [
    ...stemLefts.map((_, note) => ellipsePath(headX + note * BEAMED_NOTE_STEP, headY, HEAD)),
    ...stemLefts.map((left) => stemPath(headX + left, 0, headY)),
    ...Array.from({ length: figure.flags }, (_, beam) =>
      beamPath(
        headX + stemLefts[0],
        headX + stemLefts[count - 1] + STEM.width,
        beam * BEAM.step,
      ),
    ),
  ];

  return {
    width: round((count - 1) * BEAMED_NOTE_STEP + 2 * box.x),
    height: round(headY + box.y),
    head: { x: round(headX), y: round(headY) },
    paths,
  };
}
