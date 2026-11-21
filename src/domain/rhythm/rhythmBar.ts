import { figureById, FigureId } from './figures';

/**
 * Una barra rítmica: una línea con una duración máxima que se llena con
 * figuras puestas una detrás de otra, sin huecos. Cada figura ocupa a lo
 * ancho la parte de la barra que le toca por su duración, así que "no cabe"
 * y "no se puede sobrepasar la duración" son la misma regla.
 *
 * Es un valor inmutable: cada operación devuelve una barra nueva (o `null` si
 * la operación rompería la regla), lista para guardarse en un estado de React.
 */

/** Una figura colocada. La `key` la identifica aunque haya varias iguales. */
export interface PlacedFigure {
  readonly key: number;
  readonly figure: FigureId;
}

export interface RhythmBar {
  /** Duración máxima, en semicorcheas. */
  readonly capacity: number;
  readonly figures: readonly PlacedFigure[];
}

/** Lo que ocupa una figura colocada, en semicorcheas desde el inicio de la barra. */
export interface FigureSpan {
  readonly key: number;
  readonly figure: FigureId;
  readonly start: number;
  readonly units: number;
}

export function emptyBar(capacity: number): RhythmBar {
  return { capacity, figures: [] };
}

/** Semicorcheas ocupadas. */
export function usedUnits(bar: RhythmBar): number {
  return bar.figures.reduce((sum, placed) => sum + figureById(placed.figure).units, 0);
}

export function remainingUnits(bar: RhythmBar): number {
  return bar.capacity - usedUnits(bar);
}

export function isFull(bar: RhythmBar): boolean {
  return remainingUnits(bar) === 0;
}

export function fits(bar: RhythmBar, figure: FigureId): boolean {
  return figureById(figure).units <= remainingUnits(bar);
}

/** Dónde empieza y cuánto ocupa cada figura (para dibujarlas a escala). */
export function figureSpans(bar: RhythmBar): FigureSpan[] {
  let start = 0;
  return bar.figures.map((placed) => {
    const units = figureById(placed.figure).units;
    const span = { key: placed.key, figure: placed.figure, start, units };
    start += units;
    return span;
  });
}

/** Una clave que no usa ninguna figura de la barra. */
export function nextKey(bar: RhythmBar): number {
  return bar.figures.reduce((max, placed) => Math.max(max, placed.key), 0) + 1;
}

/**
 * Pone una figura en la posición `index` (0 = al principio; más allá del
 * final = al final) y corre las que vienen detrás. `null` si no cabe.
 */
export function insertFigure(bar: RhythmBar, figure: FigureId, index: number): RhythmBar | null {
  if (!fits(bar, figure)) return null;
  const at = Math.max(0, Math.min(index, bar.figures.length));
  const placed: PlacedFigure = { key: nextKey(bar), figure };
  return {
    ...bar,
    figures: [...bar.figures.slice(0, at), placed, ...bar.figures.slice(at)],
  };
}

export function removeFigure(bar: RhythmBar, key: number): RhythmBar {
  return { ...bar, figures: bar.figures.filter((placed) => placed.key !== key) };
}

/** Lleva una figura colocada a otra posición (contada sin ella). */
export function moveFigure(bar: RhythmBar, key: number, index: number): RhythmBar {
  const moving = bar.figures.find((placed) => placed.key === key);
  if (moving === undefined) return bar;
  const rest = bar.figures.filter((placed) => placed.key !== key);
  const at = Math.max(0, Math.min(index, rest.length));
  return { ...bar, figures: [...rest.slice(0, at), moving, ...rest.slice(at)] };
}

/**
 * Dónde entra algo soltado en el punto `position` (en semicorcheas): delante
 * de la primera figura cuya mitad queda a la derecha del punto. Así soltar
 * sobre la primera mitad de una figura la empuja, y sobre la segunda entra
 * detrás de ella.
 */
export function insertionIndex(bar: RhythmBar, position: number): number {
  const spans = figureSpans(bar);
  const index = spans.findIndex((span) => position < span.start + span.units / 2);
  return index < 0 ? spans.length : index;
}

/**
 * Como `insertionIndex`, pero mientras se arrastra: si ya se mostraba un
 * sitio (`previous`), se queda en él hasta que el punto pase la mitad de la
 * figura vecina por más de `margin` semicorcheas. Así, con el dedo quieto
 * justo en una frontera, la vista previa no salta de un lado a otro.
 */
export function stickyInsertionIndex(
  bar: RhythmBar,
  position: number,
  previous: number | null,
  margin: number,
): number {
  const fresh = insertionIndex(bar, position);
  const spans = figureSpans(bar);
  if (previous === null || previous === fresh || previous > spans.length) return fresh;
  const middle = (index: number) => spans[index].start + spans[index].units / 2;
  const low = previous === 0 ? -Infinity : middle(previous - 1) - margin;
  const high = previous === spans.length ? Infinity : middle(previous) + margin;
  return position >= low && position < high ? previous : fresh;
}
