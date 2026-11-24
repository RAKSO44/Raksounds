import {
  canTie,
  isTied,
  itemStarts,
  itemUnits,
  noteItem,
  restItem,
  setDottedAt,
  setTiedAt,
  sounds,
  toggleRestAt,
  totalUnits,
} from '../rhythmItem';

describe('elementos rítmicos (Módulo 4)', () => {
  it('un silencio dura lo mismo que su figura', () => {
    expect(itemUnits(restItem('half'))).toBe(itemUnits(noteItem('half')));
    expect(itemUnits(restItem('sixteenth'))).toBe(1);
  });

  it('el puntillo suma la mitad de la figura, también en los silencios', () => {
    expect(itemUnits(noteItem('half', { dotted: true }))).toBe(12);
    expect(itemUnits(noteItem('quarter', { dotted: true }))).toBe(6);
    expect(itemUnits(restItem('quarter', { dotted: true }))).toBe(6);
    // La semicorchea con puntillo da media semicorchea de más: sigue siendo exacto.
    expect(itemUnits(noteItem('sixteenth', { dotted: true }))).toBe(1.5);
  });

  it('cada elemento empieza donde acaba el anterior', () => {
    const items = [noteItem('quarter', { dotted: true }), noteItem('eighth'), restItem('half')];
    expect(itemStarts(items)).toEqual([0, 6, 8]);
    expect(totalUnits(items)).toBe(16);
  });

  it('solo se ligan dos notas seguidas', () => {
    const items = [noteItem('quarter'), noteItem('quarter'), restItem('quarter')];
    expect(canTie(items, 0)).toBe(true);
    expect(canTie(items, 1)).toBe(false);
    expect(canTie(items, 2)).toBe(false);
    // Una ligadura que apunta a un silencio no cuenta.
    expect(isTied(setTiedAt(items, 1, true), 1)).toBe(false);
  });

  it('cada nota es un sonido; los silencios no suenan', () => {
    const heard = sounds([noteItem('quarter'), restItem('quarter'), noteItem('half')]);
    expect(heard.map((sound) => [sound.start, sound.units])).toEqual([
      [0, 4],
      [8, 8],
    ]);
  });

  it('el puntillo prolonga el sonido: su parte se marca como prolongación', () => {
    const [sound] = sounds([noteItem('half', { dotted: true })]);
    expect(sound.units).toBe(12);
    expect(sound.parts).toEqual([
      { start: 0, units: 8, prolongation: false },
      { start: 8, units: 4, prolongation: true },
    ]);
  });

  it('la nota ligada no se vuelve a tocar: alarga el sonido anterior', () => {
    const items = setTiedAt(
      [noteItem('quarter'), noteItem('quarter'), noteItem('quarter'), noteItem('quarter')],
      1,
      true,
    );
    const heard = sounds(items);
    expect(heard.map((sound) => [sound.start, sound.units])).toEqual([
      [0, 4],
      [4, 8],
      [12, 4],
    ]);
    expect(heard[1].parts.map((part) => part.prolongation)).toEqual([false, true]);
  });

  it('blanca con puntillo y blanca ligada a negra suenan igual', () => {
    const dotted = sounds([noteItem('half', { dotted: true })]);
    const tied = sounds([noteItem('half', { tied: true }), noteItem('quarter')]);
    expect(dotted.map(({ start, units }) => [start, units])).toEqual(
      tied.map(({ start, units }) => [start, units]),
    );
  });

  it('volver silencio una nota le quita la ligadura; volver a nota la deja como estaba', () => {
    const items = [noteItem('quarter', { tied: true }), noteItem('quarter')];
    const rested = toggleRestAt(items, 0);
    expect(rested[0]).toEqual(restItem('quarter'));
    expect(toggleRestAt(rested, 0)[0]).toEqual(noteItem('quarter'));
    expect(setDottedAt(items, 1, true)[1].dotted).toBe(true);
  });
});
