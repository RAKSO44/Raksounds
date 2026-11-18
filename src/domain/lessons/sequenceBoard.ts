/**
 * El tablero de un ejercicio de ordenar: una fila de huecos, cada uno vacío
 * (`null`) o con el id de una ficha. Todo lo que se puede hacer con las fichas
 * —tocarlas o arrastrarlas— se reduce a estas operaciones puras.
 */
export type SequenceSlots = readonly (string | null)[];

export function emptySlots(length: number): SequenceSlots {
  return Array.from({ length }, () => null);
}

/** Tocar una ficha de abajo: va al primer hueco libre (si queda alguno). */
export function placeInFirstEmpty(slots: SequenceSlots, id: string): SequenceSlots {
  const free = slots.indexOf(null);
  if (free < 0 || slots.includes(id)) return slots;
  return slots.map((slot, index) => (index === free ? id : slot));
}

/** Tocar una ficha colocada (o arrastrarla abajo): vuelve a su sitio de abajo. */
export function removeFromSlots(slots: SequenceSlots, id: string): SequenceSlots {
  return slots.map((slot) => (slot === id ? null : slot));
}

/**
 * Soltar una ficha sobre el hueco `target`:
 * - si venía de otro hueco, las dos fichas se intercambian (o se mueve, si el
 *   destino estaba vacío);
 * - si venía de abajo, ocupa el hueco y la que estuviera ahí vuelve abajo.
 */
export function dropOnSlot(slots: SequenceSlots, id: string, target: number): SequenceSlots {
  if (target < 0 || target >= slots.length) return slots;
  const from = slots.indexOf(id);
  const occupant = slots[target];
  return slots.map((slot, index) => {
    if (index === target) return id;
    if (index === from) return from >= 0 ? occupant : slot;
    return slot;
  });
}

/** Todas las fichas colocadas, en orden; `null` mientras quede un hueco. */
export function filledSequence(slots: SequenceSlots): readonly string[] | null {
  const placed = slots.filter((slot): slot is string => slot !== null);
  return placed.length === slots.length ? placed : null;
}
