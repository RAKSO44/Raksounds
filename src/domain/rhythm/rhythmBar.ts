import { FigureId } from './figures';
import { canTie, itemUnits, RhythmItem } from './rhythmItem';

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
  /** Venía puesta (la barra de un ejercicio a completar): no se quita ni se mueve. */
  readonly locked?: boolean;
  /** Un silencio en vez de una nota (Módulo 4). */
  readonly rest?: boolean;
  /** Con puntillo: dura la mitad más. */
  readonly dotted?: boolean;
  /** Ligada a la siguiente (solo vale si las dos son notas). */
  readonly tied?: boolean;
}

export interface RhythmBar {
  /** Duración máxima, en semicorcheas. */
  readonly capacity: number;
  readonly figures: readonly PlacedFigure[];
}

/** Lo que ocupa una figura colocada, en semicorcheas desde el inicio de la barra. */
export interface FigureSpan extends RhythmItem {
  readonly key: number;
  readonly locked: boolean;
  readonly start: number;
  readonly units: number;
}

export function emptyBar(capacity: number): RhythmBar {
  return { capacity, figures: [] };
}

/** Una barra que ya trae figuras fijas (no se pueden quitar ni mover). */
export function lockedBar(capacity: number, figures: readonly FigureId[]): RhythmBar {
  return {
    capacity,
    figures: figures.map((figure, index) => ({ key: index + 1, figure, locked: true })),
  };
}

/** Semicorcheas ocupadas. */
export function usedUnits(bar: RhythmBar): number {
  return bar.figures.reduce((sum, placed) => sum + placedUnits(placed), 0);
}

export function remainingUnits(bar: RhythmBar): number {
  return bar.capacity - usedUnits(bar);
}

export function isFull(bar: RhythmBar): boolean {
  return remainingUnits(bar) === 0;
}

/** Lo que ocupa una figura colocada (con su puntillo). */
function placedUnits(placed: PlacedFigure): number {
  return itemUnits({ figure: placed.figure, dotted: placed.dotted === true });
}

export function fits(bar: RhythmBar, figure: FigureId, dotted = false): boolean {
  return itemUnits({ figure, dotted }) <= remainingUnits(bar);
}

/**
 * Lo escrito en la barra, en orden, como elementos rítmicos: lo que se dibuja
 * y lo que suena. Una ligadura que ya no vale (la siguiente se quitó o es un
 * silencio) simplemente no cuenta.
 */
export function barItems(bar: RhythmBar): RhythmItem[] {
  const items = bar.figures.map((placed) => ({
    figure: placed.figure,
    rest: placed.rest === true,
    dotted: placed.dotted === true,
    tied: placed.tied === true,
  }));
  return items.map((item, index) => ({ ...item, tied: item.tied && canTie(items, index) }));
}

/** Dónde empieza y cuánto ocupa cada figura (para dibujarlas a escala). */
export function figureSpans(bar: RhythmBar): FigureSpan[] {
  let start = 0;
  const items = barItems(bar);
  return bar.figures.map((placed, index) => {
    const units = placedUnits(placed);
    const span = {
      ...items[index],
      key: placed.key,
      locked: placed.locked === true,
      start,
      units,
    };
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
export function insertFigure(
  bar: RhythmBar,
  figure: FigureId,
  index: number,
  { rest = false }: { rest?: boolean } = {},
): RhythmBar | null {
  if (!fits(bar, figure)) return null;
  const at = Math.max(0, Math.min(index, bar.figures.length));
  const placed: PlacedFigure = rest
    ? { key: nextKey(bar), figure, rest }
    : { key: nextKey(bar), figure };
  return {
    ...bar,
    figures: [...bar.figures.slice(0, at), placed, ...bar.figures.slice(at)],
  };
}

/**
 * Pone o quita el puntillo de una figura colocada. `null` si con él ya no
 * cabe, o si es fija.
 */
export function toggleDot(bar: RhythmBar, key: number): RhythmBar | null {
  const placed = bar.figures.find((candidate) => candidate.key === key);
  if (placed === undefined || placed.locked === true) return null;
  const dotted = placed.dotted !== true;
  if (
    dotted &&
    itemUnits({ figure: placed.figure, dotted: true }) - placedUnits(placed) > remainingUnits(bar)
  ) {
    return null;
  }
  return {
    ...bar,
    figures: bar.figures.map((candidate) =>
      candidate === placed ? { ...placed, dotted } : candidate,
    ),
  };
}

/**
 * Liga una figura colocada con la siguiente, o quita esa ligadura. `null` si
 * no se puede: un silencio no se liga, y hace falta una nota después.
 */
export function toggleTie(bar: RhythmBar, key: number): RhythmBar | null {
  const index = bar.figures.findIndex((candidate) => candidate.key === key);
  if (index < 0) return null;
  const items = barItems(bar);
  if (items[index].tied) {
    return {
      ...bar,
      figures: bar.figures.map((placed, at) =>
        at === index ? { ...placed, tied: false } : placed,
      ),
    };
  }
  if (!canTie(items, index)) return null;
  return {
    ...bar,
    figures: bar.figures.map((placed, at) => (at === index ? { ...placed, tied: true } : placed)),
  };
}

/** Quita una figura; una fija no se quita. */
export function removeFigure(bar: RhythmBar, key: number): RhythmBar {
  return {
    ...bar,
    figures: bar.figures.filter((placed) => placed.key !== key || placed.locked === true),
  };
}

/** Lleva una figura colocada a otra posición (contada sin ella). */
export function moveFigure(bar: RhythmBar, key: number, index: number): RhythmBar {
  const moving = bar.figures.find((placed) => placed.key === key);
  if (moving === undefined || moving.locked === true) return bar;
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
