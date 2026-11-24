import { RhythmFigure } from './figures';
import {
  circlePath,
  combine,
  ellipseArea,
  Ellipse,
  ellipsePath,
  extent,
  Mass,
  point,
  polygonMass,
  polygonPath,
  rectPath,
  round,
  sampleCubic,
  StrokePoint,
  strokeOutline,
  Vec,
} from './glyphPrimitives';

/**
 * Geometría vectorial de una figura, construida a partir de sus propiedades
 * (cabeza hueca o rellena, plica, corchetes; silencio o nota; puntillo). No
 * hay un dibujo por figura: la misma receta arma las cinco figuras y sus
 * cinco silencios, y algo nuevo (plica hacia abajo…) se dibuja agregando una
 * regla aquí, no una imagen.
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

export interface FigureGlyph {
  /** Caja del dibujo, en espacios. */
  readonly width: number;
  readonly height: number;
  /**
   * Centro de la cabeza dentro de la caja: el punto que se apoya en una línea
   * (la de la barra rítmica hoy, la del pentagrama mañana). En un silencio
   * es el punto de la línea sobre el que se escribe.
   */
  readonly head: { readonly x: number; readonly y: number };
  /** Contornos rellenos (regla even-odd: un óvalo dentro de otro es un hueco). */
  readonly paths: readonly string[];
  /**
   * Lo que se le AGREGA a la figura (el puntillo, una ligadura), aparte para
   * poder pintarlo de otro color: es lo que la teoría quiere que se note.
   */
  readonly marks: readonly string[];
  /**
   * La tinta: cuánta hay (área, en espacios²) y dónde está su centro de masa
   * horizontal. Es el CENTRO ÓPTICO: el ojo centra por el peso visual, no por
   * la caja. En un grupo unido por barras la barra (lo más pesado) va sobre
   * las plicas, a la derecha de las cabezas, y centrado por la caja se ve
   * corrido a la derecha.
   */
  readonly ink: { readonly area: number; readonly x: number };
}

/**
 * Un dibujo a medio armar, con todo relativo al centro de la cabeza (0, 0).
 * Cada forma es una función del desplazamiento: al final se corre a la caja.
 */
interface Draft {
  readonly shapes: ((dx: number, dy: number) => string)[];
  readonly marks: ((dx: number, dy: number) => string)[];
  readonly masses: Mass[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function newDraft(halfWidth: number, halfHeight: number): Draft {
  return {
    shapes: [],
    marks: [],
    masses: [],
    minX: -halfWidth,
    maxX: halfWidth,
    minY: -halfHeight,
    maxY: halfHeight,
  };
}

/** Agranda la caja para que entren estos puntos. */
function include(draft: Draft, points: readonly Vec[]): void {
  points.forEach(([x, y]) => {
    draft.minX = Math.min(draft.minX, x);
    draft.maxX = Math.max(draft.maxX, x);
    draft.minY = Math.min(draft.minY, y);
    draft.maxY = Math.max(draft.maxY, y);
  });
}

/** Corre el borrador a su caja: la esquina superior izquierda pasa a ser (0, 0). */
function assemble(draft: Draft): FigureGlyph {
  const headX = -draft.minX;
  const headY = -draft.minY;
  const ink = combine(draft.masses);
  return {
    width: round(draft.maxX - draft.minX),
    height: round(draft.maxY - draft.minY),
    head: { x: round(headX), y: round(headY) },
    paths: draft.shapes.map((shape) => shape(headX, headY)),
    marks: draft.marks.map((mark) => mark(headX, headY)),
    ink: { area: round(ink.area), x: round(headX + ink.x) },
  };
}

/** Un polígono como forma del borrador (con su tinta y su caja). */
function addPolygon(draft: Draft, points: readonly Vec[]): void {
  draft.shapes.push((dx, dy) => polygonPath(points.map(([x, y]) => [x + dx, y + dy])));
  draft.masses.push(polygonMass(points));
  include(draft, points);
}

function addCircle(draft: Draft, cx: number, cy: number, r: number): void {
  draft.shapes.push((dx, dy) => circlePath(cx + dx, cy + dy, r));
  draft.masses.push({ area: Math.PI * r * r, x: cx });
  include(draft, [
    [cx - r, cy - r],
    [cx + r, cy + r],
  ]);
}

function addRect(draft: Draft, left: number, top: number, right: number, bottom: number): void {
  addPolygon(draft, [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ]);
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

/** Las tres curvas del contorno de un corchete, con su esquina en (0, 0) sobre la plica. */
function flagCurves(squash: number): Vec[][] {
  const w = STEM.width;
  const p = (x: number, y: number): Vec => [x, y * squash];
  return [
    [p(w, 0), p(w + 0.12, 0.62), p(w + 0.98, 0.9), p(w + 0.9, 1.98)],
    [p(w + 0.9, 1.98), p(w + 0.86, 2.36), p(w + 0.74, 2.62), p(w + 0.56, 2.84)],
    [p(w + 0.56, 2.84), p(w + 0.66, 2.42), p(w + 0.7, 1.62), p(0, 0.86)],
  ];
}

/**
 * Un corchete que cuelga de la plica: sale hacia la derecha, se curva hacia
 * abajo y termina en punta. `(x, y)` es su esquina superior izquierda, sobre
 * la plica; `squash` acorta su caída.
 */
function flagPath(x: number, y: number, squash: number): string {
  const curves = flagCurves(squash).map((curve) =>
    curve.slice(1).map(([cx, cy]) => point(x + cx, y + cy)),
  );
  return [
    `M${point(x, y)}`,
    `L${point(x + STEM.width, y)}`,
    ...curves.map(([b, c, d]) => `C${b} ${c} ${d}`),
    'Z',
  ].join(' ');
}

/**
 * Tinta de un corchete con la esquina en (0, 0): el contorno de `flagPath`
 * muestreado como polígono.
 */
function flagMass(squash: number): Mass {
  const points: Vec[] = [[0, 0]];
  for (const [a, b, c, d] of flagCurves(squash))
    points.push(...sampleCubic(a, b, c, d, 24).slice(1));
  return polygonMass(points);
}

/** Lo que el corchete sobresale a la derecha de la plica (hasta sus puntos de control). */
const FLAG_REACH = 0.98;
/** Lo que baja la punta de un corchete desde donde empieza. */
const FLAG_DROP = 2.84;

/** Una figura que suena: cabeza, plica y corchetes. */
function noteDraft(figure: RhythmFigure): Draft {
  const head: Ellipse = figure.stem ? HEAD : WHOLE_HEAD;
  const box = extent(head);
  const draft = newDraft(box.x, box.y);

  const hole = figure.head === 'hollow' ? (figure.stem ? HALF_HOLE : WHOLE_HOLE) : null;
  draft.masses.push({
    area: ellipseArea(head) - (hole === null ? 0 : ellipseArea(hole)),
    x: 0,
  });
  draft.shapes.push(
    (dx, dy) => ellipsePath(dx, dy, head) + (hole === null ? '' : ` ${ellipsePath(dx, dy, hole)}`),
  );

  if (figure.stem) {
    // La plica va pegada al borde derecho de la cabeza (plica hacia arriba).
    const stemLeft = box.x - STEM.width;
    const stemTop = -(STEM.length + Math.max(0, figure.flags - 1) * STEM.extraPerFlag);
    draft.shapes.push((dx, dy) => stemPath(stemLeft + dx, stemTop + dy, dy));
    draft.masses.push({ area: STEM.width * -stemTop, x: stemLeft + STEM.width / 2 });
    draft.minY = Math.min(draft.minY, stemTop);

    const squash = figure.flags > 1 ? STACKED_FLAG_SQUASH : 1;
    for (let flag = 0; flag < figure.flags; flag++) {
      const flagTop = stemTop + flag * FLAG_GAP;
      draft.shapes.push((dx, dy) => flagPath(stemLeft + dx, flagTop + dy, squash));
      const flagInk = flagMass(squash);
      draft.masses.push({ area: flagInk.area, x: stemLeft + flagInk.x });
      draft.maxX = Math.max(draft.maxX, box.x + FLAG_REACH);
      draft.maxY = Math.max(draft.maxY, flagTop + FLAG_DROP * squash);
    }
  }
  return draft;
}

/** Construye el dibujo de una figura a partir de sus propiedades. */
export function figureGlyph(figure: RhythmFigure): FigureGlyph {
  return assemble(noteDraft(figure));
}

/**
 * Silencios de redonda y blanca: el mismo bloque, colgando DEBAJO de la línea
 * (redonda) o sentado ENCIMA (blanca). Es lo único que los distingue.
 */
const REST_BLOCK = { width: 1.24, height: 0.5 } as const;
/** Línea corta que se dibuja con ellos cuando no hay otra línea donde apoyarlos. */
const REST_LEDGER = { width: 1.9, thickness: 0.12 } as const;
/**
 * Silencio de negra: el zigzag, como la línea central de un trazo de pluma
 * (x, y, grosor), de arriba abajo. Termina en un gancho como una "c".
 */
const QUARTER_REST_ZIGZAG: readonly StrokePoint[] = [
  { x: 0.24, y: 0, width: 0.1 },
  { x: 0.84, y: 0.78, width: 0.3 },
  { x: 0.34, y: 1.42, width: 0.38 },
  { x: 0.86, y: 2.08, width: 0.12 },
];
const QUARTER_REST_HOOK: readonly Vec[] = [
  [0.86, 2.08],
  [0.3, 1.84],
  [0.04, 2.5],
  [0.58, 2.96],
];
/**
 * Silencios con bolitas (corchea, semicorchea): un palito inclinado y, a su
 * izquierda, una bolita con su bracito por cada corchete que tendría su figura.
 */
const FLAG_REST = {
  /** Lo que se corre a la izquierda el palito por cada espacio que baja. */
  slope: 0.3,
  /** Largo con una bolita y lo que crece por cada bolita más. */
  length: 1.85,
  step: 0.95,
  stem: 0.13,
  ball: 0.26,
  /** De la bolita al palito, a lo ancho; y cuánto cuelga el bracito. */
  reach: 0.8,
  sag: 0.5,
  arm: 0.12,
} as const;
/** Donde termina el silencio por abajo, bajo la línea: casi en ella, como las cabezas. */
const REST_FOOT = 0.35;

/** El silencio de una figura, construido con las mismas propiedades que la figura. */
function restDraft(figure: RhythmFigure, ledger: boolean): Draft {
  const draft = newDraft(0, 0);

  if (figure.flags === 0 && (figure.head === 'hollow' || !figure.stem)) {
    const half = REST_BLOCK.width / 2;
    // Sin plica (redonda) cuelga; con plica (blanca) se sienta.
    if (figure.stem) addRect(draft, -half, -REST_BLOCK.height, half, 0);
    else addRect(draft, -half, 0, half, REST_BLOCK.height);
    if (ledger) {
      const edge = REST_LEDGER.width / 2;
      const t = REST_LEDGER.thickness / 2;
      addRect(draft, -edge, -t, edge, t);
    }
    return draft;
  }

  if (figure.flags === 0) {
    const top = -(QUARTER_REST_HOOK[3][1] - REST_FOOT);
    const centerX = 0.45;
    const hook = sampleCubic(...(QUARTER_REST_HOOK as [Vec, Vec, Vec, Vec]), 12).map(
      ([x, y], step, all): StrokePoint => ({
        x,
        y,
        // El gancho engorda en la curva y se afina en la punta.
        width: 0.12 + Math.sin((Math.PI * step) / (all.length - 1)) * 0.2,
      }),
    );
    const line = [...QUARTER_REST_ZIGZAG, ...hook.slice(1)].map((p) => ({
      ...p,
      x: p.x - centerX,
      y: p.y + top,
    }));
    addPolygon(draft, strokeOutline(line));
    return draft;
  }

  const count = figure.flags;
  const length = FLAG_REST.length + (count - 1) * FLAG_REST.step;
  const top = REST_FOOT - length;
  // El palito: de arriba a la derecha hacia abajo a la izquierda.
  const stemX = (y: number) => (length - (y - top)) * FLAG_REST.slope;
  addPolygon(
    draft,
    strokeOutline([
      { x: stemX(top), y: top, width: FLAG_REST.stem },
      { x: stemX(REST_FOOT), y: REST_FOOT, width: FLAG_REST.stem },
    ]),
  );
  for (let ball = 0; ball < count; ball++) {
    const y = top + ball * FLAG_REST.step;
    const joint: Vec = [stemX(y), y];
    const center: Vec = [joint[0] - FLAG_REST.reach, y + FLAG_REST.ball];
    addCircle(draft, center[0], center[1], FLAG_REST.ball);
    // El bracito sale de la bolita, cuelga un poco y sube hasta el palito.
    const arm = sampleCubic(
      [center[0] + FLAG_REST.ball * 0.6, center[1] + FLAG_REST.ball * 0.5],
      [center[0] + 0.3, y + FLAG_REST.sag],
      [joint[0] - 0.2, y + FLAG_REST.sag * 0.6],
      joint,
      8,
    ).map(([x, armY]): StrokePoint => ({ x, y: armY, width: FLAG_REST.arm }));
    addPolygon(draft, strokeOutline(arm));
  }
  return draft;
}

export interface RestGlyphOptions {
  /**
   * Dibuja con los silencios de redonda y blanca una línea corta: sin ella
   * (en una tabla, en una ficha) no se sabe si cuelgan o se sientan. Donde ya
   * hay una línea (la barra rítmica) sobra.
   */
  readonly ledger?: boolean;
}

/** El silencio que dura lo mismo que `figure`. */
export function restGlyph(figure: RhythmFigure, { ledger = false }: RestGlyphOptions = {}) {
  return assemble(restDraft(figure, ledger));
}

/** El puntillo: radio y lo que se separa de la figura. */
const DOT = { radius: 0.2, gap: 0.35 } as const;

/**
 * Agrega el puntillo como MARCA (aparte de la tinta de la figura). Va a la
 * derecha y medio espacio más arriba: la cabeza está sobre la línea y el
 * puntillo se escribe en el espacio, nunca sobre una línea. En una figura con
 * corchete va pasado el corchete, para que no se confunda con su punta.
 */
function addDot(draft: Draft, figure: RhythmFigure, rest: boolean): void {
  const headEdge = rest ? draft.maxX : extent(figure.stem ? HEAD : WHOLE_HEAD).x;
  const edge = !rest && figure.flags > 0 ? draft.maxX : headEdge;
  const cx = edge + DOT.gap + DOT.radius;
  const cy = -0.5;
  draft.marks.push((dx, dy) => circlePath(cx + dx, cy + dy, DOT.radius));
  draft.masses.push({ area: Math.PI * DOT.radius ** 2, x: cx });
  include(draft, [
    [cx - DOT.radius, cy - DOT.radius],
    [cx + DOT.radius, cy + DOT.radius],
  ]);
}

/** Lo que define el dibujo de algo escrito: su figura, si calla y si lleva puntillo. */
export interface ItemShape {
  readonly figure: RhythmFigure;
  readonly rest: boolean;
  readonly dotted: boolean;
}

function itemDraft({ figure, rest, dotted }: ItemShape, ledger: boolean): Draft {
  const draft = rest ? restDraft(figure, ledger) : noteDraft(figure);
  if (dotted) addDot(draft, figure, rest);
  return draft;
}

/** Una figura o un silencio, con o sin puntillo. */
export function itemGlyph(item: ItemShape, options: RestGlyphOptions = {}): FigureGlyph {
  return assemble(itemDraft(item, options.ledger === true));
}

/** Ligadura: grosor en el centro y cuánto se curva según su largo. */
const TIE = { thickness: 0.2, minDepth: 0.35, maxDepth: 0.75, depthPerSpace: 0.12 } as const;
/**
 * Una cúbica con los dos puntos de control a la misma altura baja 3/4 de esa
 * altura: los controles van 4/3 más abajo para que la curva llegue a su hondo.
 */
const TIE_CONTROL = 4 / 3;
/** Lo que la ligadura baja del centro de las cabezas: sale por debajo de ellas. */
export const TIE_DROP = 0.75;

/** Cuánto baja la curva de una ligadura de este largo (en espacios). */
export function tieDepth(length: number): number {
  return Math.min(TIE.maxDepth, Math.max(TIE.minDepth, length * TIE.depthPerSpace));
}

/**
 * La ligadura: una media luna de (x, y) a (x + length, y) que se curva hacia
 * ABAJO, del lado contrario a las plicas. Fina en las puntas y gruesa en el
 * centro.
 */
export function tiePath(x: number, y: number, length: number): string {
  const depth = tieDepth(length);
  const outer = depth + TIE.thickness / 2;
  const inner = depth - TIE.thickness / 2;
  const c = (fx: number, dy: number) => point(x + length * fx, y + dy);
  return [
    `M${point(x, y)}`,
    `C${c(0.2, outer * TIE_CONTROL)} ${c(0.8, outer * TIE_CONTROL)} ${point(x + length, y)}`,
    `C${c(0.8, inner * TIE_CONTROL)} ${c(0.2, inner * TIE_CONTROL)} ${point(x, y)}`,
    'Z',
  ].join(' ');
}

/** Separación entre las cabezas de un grupo escrito (no a escala de duración). */
const PHRASE_STEP = 2.6;

/**
 * Varias figuras escritas en fila, a distancia fija (no a escala), con sus
 * puntillos y ligaduras como marcas: el dibujo de una ficha ("𝅗𝅥⌒𝅘𝅥").
 * `tied[i]` liga la figura `i` con la siguiente.
 */
export function phraseGlyph(items: readonly ItemShape[], tied: readonly boolean[]): FigureGlyph {
  const drafts = items.map((item) => itemDraft(item, true));
  const draft = newDraft(0, 0);
  let headX = 0;
  const heads: number[] = [];
  drafts.forEach((part, index) => {
    if (index > 0) {
      const previous = drafts[index - 1];
      // Lo justo para que no se toquen, y al menos el paso de siempre.
      headX += Math.max(PHRASE_STEP, previous.maxX - part.minX + 0.5);
    }
    heads.push(headX);
    const at = headX;
    draft.shapes.push(
      ...part.shapes.map((shape) => (dx: number, dy: number) => shape(dx + at, dy)),
    );
    draft.marks.push(...part.marks.map((mark) => (dx: number, dy: number) => mark(dx + at, dy)));
    draft.masses.push(...part.masses.map((mass) => ({ area: mass.area, x: mass.x + at })));
    include(draft, [
      [part.minX + at, part.minY],
      [part.maxX + at, part.maxY],
    ]);
  });
  heads.slice(0, -1).forEach((from, index) => {
    if (tied[index] !== true) return;
    const x = from + HEAD.rx * 0.6;
    const length = heads[index + 1] - HEAD.rx * 0.6 - x;
    draft.marks.push((dx, dy) => tiePath(x + dx, TIE_DROP + dy, length));
    // Hasta los puntos de control de su curva (la caja los contiene).
    include(draft, [[x, TIE_DROP + (tieDepth(length) + TIE.thickness / 2) * TIE_CONTROL]]);
  });
  return assemble(draft);
}

/** Distancia entre los centros de dos cabezas de un grupo unido por barras. */
const BEAMED_NOTE_STEP = 2.4;
/** Barra que une las plicas: grosor y distancia de una barra a la siguiente. */
const BEAM = { thickness: 0.5, step: 0.8 } as const;

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
      rectPath(
        headX + stemLefts[0],
        beam * BEAM.step,
        headX + stemLefts[count - 1] + STEM.width,
        beam * BEAM.step + BEAM.thickness,
      ),
    ),
  ];

  const beamLeft = headX + stemLefts[0];
  const beamRight = headX + stemLefts[count - 1] + STEM.width;
  const ink = combine([
    ...stemLefts.map((_, note) => ({
      area: ellipseArea(HEAD),
      x: headX + note * BEAMED_NOTE_STEP,
    })),
    ...stemLefts.map((left) => ({ area: STEM.width * headY, x: headX + left + STEM.width / 2 })),
    {
      area: figure.flags * (beamRight - beamLeft) * BEAM.thickness,
      x: (beamLeft + beamRight) / 2,
    },
  ]);

  return {
    width: round((count - 1) * BEAMED_NOTE_STEP + 2 * box.x),
    height: round(headY + box.y),
    head: { x: round(headX), y: round(headY) },
    paths,
    marks: [],
    ink: { area: round(ink.area), x: round(ink.x) },
  };
}
