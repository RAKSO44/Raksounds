import { act, renderHook } from '@testing-library/react-native';

import { useBarPlayground } from '../useBarPlayground';

const ids = (bar: { figures: readonly { figure: string }[] }) =>
  bar.figures.map((placed) => placed.figure);

async function setup() {
  const hook = await renderHook(() => useBarPlayground(16));
  return hook.result;
}

describe('useBarPlayground — arrastrar con vista previa', () => {
  it('muestra dónde caería al acercarse, cambia de sitio y vuelve al alejarse', async () => {
    const result = await setup();
    await act(() => result.current.add('half'));
    const quarter = { kind: 'palette', figure: 'quarter' } as const;

    // Sobre la primera mitad de la blanca: entraría delante.
    await act(() => result.current.hover(quarter, 2));
    expect(result.current.previewing).toBe(true);
    expect(ids(result.current.shown)).toEqual(['quarter', 'half']);
    expect(ids(result.current.bar)).toEqual(['half']);

    // Justo pasada la mitad no salta (margen); bien pasada, sí.
    await act(() => result.current.hover(quarter, 4.2));
    expect(ids(result.current.shown)).toEqual(['quarter', 'half']);
    await act(() => result.current.hover(quarter, 6));
    expect(ids(result.current.shown)).toEqual(['half', 'quarter']);

    // Lejos de la barra todo vuelve a como estaba y soltar no cambia nada.
    await act(() => result.current.hover(quarter, null));
    expect(result.current.previewing).toBe(false);
    await act(() => result.current.drop(quarter));
    expect(ids(result.current.bar)).toEqual(['half']);
  });

  it('soltar aplica exactamente lo que se mostraba', async () => {
    const result = await setup();
    await act(() => result.current.add('half'));
    await act(() => result.current.add('quarter'));
    const half = { kind: 'bar', key: result.current.bar.figures[0].key } as const;

    // La blanca, llevada al final: la negra se corre al principio.
    await act(() => result.current.hover(half, 11));
    expect(ids(result.current.shown)).toEqual(['quarter', 'half']);
    await act(() => result.current.drop(half));
    expect(ids(result.current.bar)).toEqual(['quarter', 'half']);
    expect(result.current.previewing).toBe(false);
  });

  it('una figura que no cabe no se muestra y, al soltarla cerca, la barra la rechaza', async () => {
    const result = await setup();
    await act(() => result.current.add('whole'));
    const eighth = { kind: 'palette', figure: 'eighth' } as const;

    await act(() => result.current.hover(eighth, 8));
    expect(result.current.previewing).toBe(false);
    await act(() => result.current.drop(eighth));
    expect(ids(result.current.bar)).toEqual(['whole']);
  });
});
