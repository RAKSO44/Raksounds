import {
  dropOnSlot,
  emptySlots,
  filledSequence,
  placeInFirstEmpty,
  removeFromSlots,
} from '../sequenceBoard';

describe('tablero de ordenar', () => {
  it('tocar coloca en el primer hueco libre y no repite una ficha', () => {
    let slots = emptySlots(3);
    slots = placeInFirstEmpty(slots, 'a');
    slots = placeInFirstEmpty(slots, 'b');
    expect(slots).toEqual(['a', 'b', null]);
    expect(placeInFirstEmpty(slots, 'a')).toBe(slots);
  });

  it('tocar una colocada deja su hueco vacío sin mover las demás', () => {
    expect(removeFromSlots(['a', 'b', 'c'], 'b')).toEqual(['a', null, 'c']);
    // Al volver a tocar otra de abajo, ocupa ese hueco.
    expect(placeInFirstEmpty(['a', null, 'c'], 'd')).toEqual(['a', 'd', 'c']);
  });

  it('con todo lleno no se coloca nada más', () => {
    expect(placeInFirstEmpty(['a', 'b'], 'c')).toEqual(['a', 'b']);
  });

  it('arrastrar de abajo a un hueco vacío lo ocupa', () => {
    expect(dropOnSlot([null, null, null], 'a', 2)).toEqual([null, null, 'a']);
  });

  it('arrastrar de abajo a un hueco ocupado las intercambia: la de antes vuelve abajo', () => {
    expect(dropOnSlot(['a', 'b', null], 'c', 0)).toEqual(['c', 'b', null]);
  });

  it('arrastrar entre huecos intercambia las dos fichas', () => {
    expect(dropOnSlot(['a', 'b', 'c'], 'a', 2)).toEqual(['c', 'b', 'a']);
  });

  it('arrastrar a un hueco vacío desde otro hueco la mueve', () => {
    expect(dropOnSlot(['a', null, 'c'], 'a', 1)).toEqual([null, 'a', 'c']);
  });

  it('soltarla en su propio hueco no cambia nada', () => {
    expect(dropOnSlot(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  });

  it('fuera del tablero se ignora', () => {
    expect(dropOnSlot(['a', null], 'b', 5)).toEqual(['a', null]);
  });

  it('la secuencia solo está lista con todos los huecos llenos', () => {
    expect(filledSequence(['a', null])).toBeNull();
    expect(filledSequence(['b', 'a'])).toEqual(['b', 'a']);
  });
});
