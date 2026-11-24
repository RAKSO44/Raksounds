/**
 * Piezas geométricas con las que se arman los dibujos de `glyph.ts`: óvalos,
 * círculos, trazos de grosor variable y el cálculo de cuánta tinta tienen.
 * Todo se mide en ESPACIOS de pentagrama. No se exporta desde el barrel: es
 * la cocina de los dibujos, no parte de su API.
 */

export const round = (value: number) => Math.round(value * 1000) / 1000;
export const point = (x: number, y: number) => `${round(x)},${round(y)}`;

export interface Ellipse {
  readonly rx: number;
  readonly ry: number;
  /** Inclinación en grados (negativa: sube hacia la derecha). */
  readonly tilt: number;
}

/** Un trozo de tinta: su área y la x de su centro de masa. */
export interface Mass {
  readonly area: number;
  readonly x: number;
}

/** Centro de masa de varios trozos. */
export function combine(masses: readonly Mass[]): Mass {
  const area = masses.reduce((sum, mass) => sum + mass.area, 0);
  const x = area === 0 ? 0 : masses.reduce((sum, mass) => sum + mass.area * mass.x, 0) / area;
  return { area, x };
}

/** Medio ancho y medio alto de un óvalo inclinado (su caja). */
export function extent({ rx, ry, tilt }: Ellipse): { x: number; y: number } {
  const t = (tilt * Math.PI) / 180;
  return {
    x: Math.sqrt(rx ** 2 * Math.cos(t) ** 2 + ry ** 2 * Math.sin(t) ** 2),
    y: Math.sqrt(rx ** 2 * Math.sin(t) ** 2 + ry ** 2 * Math.cos(t) ** 2),
  };
}

/** Un óvalo inclinado como contorno cerrado (dos medios arcos). */
export function ellipsePath(cx: number, cy: number, { rx, ry, tilt }: Ellipse): string {
  const t = (tilt * Math.PI) / 180;
  const dx = rx * Math.cos(t);
  const dy = rx * Math.sin(t);
  const arc = (x: number, y: number) => `A${round(rx)},${round(ry)} ${tilt} 1 0 ${point(x, y)}`;
  return `M${point(cx + dx, cy + dy)} ${arc(cx - dx, cy - dy)} ${arc(cx + dx, cy + dy)} Z`;
}

export const ellipseArea = ({ rx, ry }: Ellipse) => Math.PI * rx * ry;

/** Un círculo (el puntillo, la bolita de un silencio). */
export function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, { rx: r, ry: r, tilt: 0 });
}

/** Un rectángulo cerrado. */
export function rectPath(left: number, top: number, right: number, bottom: number): string {
  return `M${point(left, top)} L${point(right, top)} L${point(right, bottom)} L${point(left, bottom)} Z`;
}

export type Vec = readonly [number, number];

/** Un polígono cerrado. */
export function polygonPath(points: readonly Vec[]): string {
  return `M${points.map(([x, y]) => point(x, y)).join(' L')} Z`;
}

/** Área y centro de masa horizontal de un polígono (fórmula de Gauss). */
export function polygonMass(points: readonly Vec[]): Mass {
  let doubled = 0;
  let moment = 0;
  points.forEach(([x0, y0], index) => {
    const [x1, y1] = points[(index + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    doubled += cross;
    moment += (x0 + x1) * cross;
  });
  if (doubled === 0) return { area: 0, x: 0 };
  return { area: Math.abs(doubled) / 2, x: moment / (3 * doubled) };
}

/** Punto de una curva de Bézier cúbica en `t`. */
export function bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u ** 3 * p0 + 3 * u ** 2 * t * p1 + 3 * u * t ** 2 * p2 + t ** 3 * p3;
}

/** `steps + 1` puntos de una cúbica de `a` a `d`. */
export function sampleCubic(a: Vec, b: Vec, c: Vec, d: Vec, steps: number): Vec[] {
  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = step / steps;
    return [bezier(a[0], b[0], c[0], d[0], t), bezier(a[1], b[1], c[1], d[1], t)] as const;
  });
}

/** Un punto de un trazo con el grosor que tiene ahí. */
export interface StrokePoint {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/** Hasta cuánto se alarga una esquina aguda (como el límite de inglete de SVG). */
const MITER_LIMIT = 2;

/**
 * El contorno de un trazo de pluma que pasa por estos puntos, con el grosor
 * de cada uno: el lado izquierdo de ida y el derecho de vuelta. En cada
 * esquina se usa la bisectriz (esquina en punta, sin hueco ni montura).
 */
export function strokeOutline(points: readonly StrokePoint[]): Vec[] {
  const normals = points.slice(1).map((p, index) => {
    const q = points[index];
    const length = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    return [-(p.y - q.y) / length, (p.x - q.x) / length] as const;
  });
  const offsets = points.map((p, index) => {
    const before = normals[Math.max(0, index - 1)];
    const after = normals[Math.min(normals.length - 1, index)];
    const sum: Vec = [before[0] + after[0], before[1] + after[1]];
    const length = Math.hypot(sum[0], sum[1]) || 1;
    const bisector: Vec = [sum[0] / length, sum[1] / length];
    // Cuanto más cerrada la esquina, más hay que alejarse para conservar el grosor.
    const cos = bisector[0] * after[0] + bisector[1] * after[1];
    const scale = Math.min(MITER_LIMIT, 1 / Math.max(cos, 1 / MITER_LIMIT));
    return [bisector[0] * (p.width / 2) * scale, bisector[1] * (p.width / 2) * scale] as const;
  });
  const left = points.map((p, index) => [p.x + offsets[index][0], p.y + offsets[index][1]] as Vec);
  const right = points.map((p, index) => [p.x - offsets[index][0], p.y - offsets[index][1]] as Vec);
  return [...left, ...right.reverse()];
}
