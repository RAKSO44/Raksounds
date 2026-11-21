/**
 * Las figuras musicales como OBJETOS con propiedades (Módulo 3). Todo lo que
 * la app hace con una figura —dibujarla, medir cuánto espacio ocupa en una
 * barra, hacerla sonar, compararla con otra— sale de estos datos, nunca de una
 * imagen ni de un patrón fijo para cada caso.
 */

export type FigureId = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export interface RhythmFigure {
  readonly id: FigureId;
  /** Nombre en español ("Redonda"). */
  readonly name: string;
  /**
   * Duración en semicorcheas, la figura más corta que se enseña: así toda
   * duración es un entero y sumar o comparar figuras no arrastra decimales.
   */
  readonly units: number;
  /** Cabeza hueca (redonda, blanca) o rellena (negra y más cortas). */
  readonly head: 'hollow' | 'filled';
  /** La redonda es la única sin plica. */
  readonly stem: boolean;
  /** Corchetes al final de la plica: 1 la corchea, 2 la semicorchea. */
  readonly flags: number;
}

/** Semicorcheas que dura una negra: la figura que vale un pulso. */
export const QUARTER_UNITS = 4;

/** Las cinco figuras, de la que más dura a la que menos (el orden de la teoría). */
export const FIGURES: readonly RhythmFigure[] = [
  { id: 'whole', name: 'Redonda', units: 16, head: 'hollow', stem: false, flags: 0 },
  { id: 'half', name: 'Blanca', units: 8, head: 'hollow', stem: true, flags: 0 },
  { id: 'quarter', name: 'Negra', units: 4, head: 'filled', stem: true, flags: 0 },
  { id: 'eighth', name: 'Corchea', units: 2, head: 'filled', stem: true, flags: 1 },
  { id: 'sixteenth', name: 'Semicorchea', units: 1, head: 'filled', stem: true, flags: 2 },
];

export function figureById(id: FigureId): RhythmFigure {
  const figure = FIGURES.find((candidate) => candidate.id === id);
  // FigureId es una unión cerrada y FIGURES la cubre entera (lo prueba su test).
  if (figure === undefined) throw new Error(`Figura desconocida: ${id}`);
  return figure;
}

/**
 * Cuántos pulsos dura, tomando la negra como un pulso. Una figura no dura un
 * tiempo fijo: dura una proporción del pulso, que cambia con cada canción.
 */
export function figureBeats(figure: RhythmFigure): number {
  return figure.units / QUARTER_UNITS;
}

/** Cuánto suena a un tempo dado, en ms. */
export function figureDurationMs(figure: RhythmFigure, bpm: number): number {
  return (figureBeats(figure) * 60_000) / bpm;
}

/** Cuántas veces cabe `b` en `a` ("la blanca dura el doble que la negra" → 2). */
export function durationRatio(a: RhythmFigure, b: RhythmFigure): number {
  return a.units / b.units;
}

/**
 * La figura que dura la mitad, o `null` si ya es la más corta. Es la relación
 * que enseña la tabla: cada figura vale la mitad de la anterior.
 */
export function halfOf(figure: RhythmFigure): RhythmFigure | null {
  return FIGURES.find((candidate) => candidate.units * 2 === figure.units) ?? null;
}

/** La figura que dura el doble, o `null` si ya es la más larga. */
export function doubleOf(figure: RhythmFigure): RhythmFigure | null {
  return FIGURES.find((candidate) => candidate.units === figure.units * 2) ?? null;
}

/**
 * Cuántas de esta figura caben en una redonda (1, 2, 4, 8, 16): su "valor
 * relativo" es 1/n de unidad, tomando la redonda como la unidad.
 */
export function wholeDivisions(figure: RhythmFigure): number {
  return figureById('whole').units / figure.units;
}
