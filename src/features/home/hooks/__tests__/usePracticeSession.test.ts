import { act, renderHook } from '@testing-library/react-native';

import { usePracticeSession } from '../usePracticeSession';

const mockPlayEffect = jest.fn();
jest.mock('../useLessonSounds', () => ({ useLessonSounds: () => mockPlayEffect }));

describe('usePracticeSession', () => {
  it('un doble toque en "Comprobar" califica una sola vez y no corre los veredictos', async () => {
    const { result } = await renderHook(() => usePracticeSession('figures', 11));

    const first = result.current.exercise;
    if (first?.mechanic !== 'choice') throw new Error();
    await act(() => result.current.setAnswer({ kind: 'option', id: first.answer }));
    await act(() => {
      // Las dos llamadas comparten el mismo render: la fase aún no cambió.
      result.current.confirm();
      result.current.confirm();
    });
    expect(result.current.isCorrect).toBe(true);
    expect(mockPlayEffect).toHaveBeenCalledTimes(1);

    await act(() => result.current.advance());
    const second = result.current.exercise;
    if (second?.mechanic !== 'choice') throw new Error();
    const wrong = second.options.find((option) => option.id !== second.answer);
    if (wrong === undefined) throw new Error();
    await act(() => result.current.setAnswer({ kind: 'option', id: wrong.id }));
    await act(() => result.current.confirm());

    expect(result.current.isCorrect).toBe(false);
    expect(result.current.score).toBe(1);
    expect(result.current.failed).toEqual([2]);
  });
});
