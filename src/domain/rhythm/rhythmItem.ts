import { figureById, FigureId } from './figures';

/**
 * Lo que se escribe en una línea rítmica (Módulo 4): una figura que SUENA
 * (nota) o que CALLA (silencio), con o sin puntillo, y si va ligada a la
 * siguiente. Son propiedades, no casos: cualquier figura puede ser silencio,
 * llevar puntillo o ligarse, y todo lo demás (cuánto dura, cómo se dibuja,
 * cómo suena) se calcula a partir de ellas.
 */
export interface RhythmItem {
  readonly figure: FigureId;
  /** Un silencio: dura lo mismo que su figura, pero no suena. */
  readonly rest: boolean;
  /** El puntillo le suma la mitad de lo que dura. */
  readonly dotted: boolean;
  /**
   * Ligada a la siguiente: la siguiente no se vuelve a tocar, prolonga esta.
   * Solo cuenta si las dos son notas (ver `isTied`).
   */
  readonly tied: boolean;
}

interface ItemOptions {
  readonly dotted?: boolean;
  readonly tied?: boolean;
}

/** Una nota. */
export function noteItem(figure: FigureId, { dotted = false, tied = false }: ItemOptions = {}) {
  return { figure, rest: false, dotted, tied } satisfies RhythmItem;
}

/** Un silencio. Un silencio no se liga: no hay sonido que prolongar. */
export function restItem(figure: FigureId, { dotted = false }: ItemOptions = {}) {
  return { figure, rest: true, dotted, tied: false } satisfies RhythmItem;
}

/** Lo que el puntillo le suma: la mitad de su figura, en semicorcheas. */
export function dotUnits(item: Pick<RhythmItem, 'figure' | 'dotted'>): number {
  return item.dotted ? figureById(item.figure).units / 2 : 0;
}

/**
 * Cuánto dura, en semicorcheas. Con puntillo sobre una semicorchea da 1,5:
 * las mitades son exactas en coma flotante, así que sumar sigue sin errores.
 */
export function itemUnits(item: Pick<RhythmItem, 'figure' | 'dotted'>): number {
  return figureById(item.figure).units + dotUnits(item);
}

export function totalUnits(items: readonly RhythmItem[]): number {
  return items.reduce((sum, item) => sum + itemUnits(item), 0);
}

/** Dónde empieza cada una, en semicorcheas desde el inicio. */
export function itemStarts(items: readonly RhythmItem[]): number[] {
  let start = 0;
  return items.map((item) => {
    const at = start;
    start += itemUnits(item);
    return at;
  });
}

/** ¿La de `index` se puede ligar a la siguiente? Las dos tienen que sonar. */
export function canTie(items: readonly RhythmItem[], index: number): boolean {
  const next = items[index + 1];
  return !items[index].rest && next !== undefined && !next.rest;
}

/** ¿La de `index` está ligada a la siguiente (y la ligadura vale)? */
export function isTied(items: readonly RhythmItem[], index: number): boolean {
  return items[index].tied && canTie(items, index);
}

/** Pone o quita el silencio de la de `index` (al volverse silencio pierde su ligadura). */
export function toggleRestAt(items: readonly RhythmItem[], index: number): RhythmItem[] {
  return items.map((item, at) =>
    at === index ? { ...item, rest: !item.rest, tied: item.rest ? item.tied : false } : item,
  );
}

export function setDottedAt(
  items: readonly RhythmItem[],
  index: number,
  dotted: boolean,
): RhythmItem[] {
  return items.map((item, at) => (at === index ? { ...item, dotted } : item));
}

export function setTiedAt(
  items: readonly RhythmItem[],
  index: number,
  tied: boolean,
): RhythmItem[] {
  return items.map((item, at) => (at === index ? { ...item, tied } : item));
}

/**
 * Un trozo de un sonido: lo que vale su figura o lo que lo PROLONGA (el
 * puntillo, o la nota ligada). Es lo que la barra de duración pinta distinto.
 */
export interface SoundPart {
  readonly start: number;
  readonly units: number;
  readonly prolongation: boolean;
}

/** Un sonido de principio a fin: lo que se toca UNA vez. */
export interface Sound {
  readonly start: number;
  readonly units: number;
  readonly parts: readonly SoundPart[];
}

/**
 * Los sonidos que se oyen: cada nota abre uno, salvo que la anterior esté
 * ligada a ella (entonces lo alarga); los silencios no suenan. Todo en
 * semicorcheas desde el inicio.
 */
export function sounds(items: readonly RhythmItem[]): Sound[] {
  const result: Sound[] = [];
  const starts = itemStarts(items);
  let open: { start: number; parts: SoundPart[] } | null = null;

  items.forEach((item, index) => {
    const start = starts[index];
    if (item.rest) return;
    const base = figureById(item.figure).units;
    const parts: SoundPart[] = [];
    if (open === null) {
      open = { start, parts };
      parts.push({ start, units: base, prolongation: false });
    } else {
      // Viene ligada: no se vuelve a tocar, toda ella prolonga el sonido.
      open.parts.push({ start, units: base, prolongation: true });
    }
    const dot = dotUnits(item);
    if (dot > 0) open.parts.push({ start: start + base, units: dot, prolongation: true });
    if (!isTied(items, index)) {
      const last = open.parts[open.parts.length - 1];
      result.push({
        start: open.start,
        units: last.start + last.units - open.start,
        parts: open.parts,
      });
      open = null;
    }
  });
  return result;
}
