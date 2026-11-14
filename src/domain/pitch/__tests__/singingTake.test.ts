import { PitchFrame, TAKE_RULES, takePitch, takeState } from '../singingTake';

const FRAME_MS = 50;

/** Construye cuadros consecutivos de 50 ms a partir de alturas (null = silencio). */
function frames(pitches: readonly (number | null)[]): PitchFrame[] {
  return pitches.map((midi, index) => ({
    timeMs: (index + 1) * FRAME_MS,
    durationMs: FRAME_MS,
    midi,
  }));
}

function repeat<T>(value: T, times: number): T[] {
  return Array.from({ length: times }, () => value);
}

describe('takeState', () => {
  it('sin cuadros está esperando', () => {
    expect(takeState([])).toBe('waiting');
  });

  it('espera mientras solo hay silencio', () => {
    expect(takeState(frames(repeat(null, 10)))).toBe('waiting');
  });

  it('se abandona si nadie canta en el tiempo límite', () => {
    const count = TAKE_RULES.noVoiceTimeoutMs / FRAME_MS;
    expect(takeState(frames(repeat(null, count)))).toBe('silent');
  });

  it('sigue abierta mientras se canta', () => {
    expect(takeState(frames([null, ...repeat(67, 10)]))).toBe('singing');
  });

  it('se cierra sola tras cantar lo suficiente y callar', () => {
    const silence = TAKE_RULES.endSilenceMs / FRAME_MS;
    expect(takeState(frames([...repeat(67, 12), ...repeat(null, silence)]))).toBe('finished');
  });

  it('una pausa corta no cierra la toma', () => {
    expect(takeState(frames([...repeat(67, 12), null, null]))).toBe('singing');
  });

  it('un golpe corto seguido de silencio no cuenta como canto', () => {
    const silence = TAKE_RULES.endSilenceMs / FRAME_MS;
    expect(takeState(frames([67, 67, ...repeat(null, silence)]))).toBe('silent');
  });

  it('se cierra al llegar a la duración máxima', () => {
    const count = TAKE_RULES.maxDurationMs / FRAME_MS;
    expect(takeState(frames(repeat(67, count)))).toBe('finished');
  });
});

describe('takePitch', () => {
  it('es la mediana de la voz, sin el ataque', () => {
    // Entra deslizando desde abajo (ataque) y luego se mantiene en 67.
    const take = frames([null, 60, 62, 64, 66, ...repeat(67, 10), null]);
    expect(takePitch(take)).toBe(67);
  });

  it('un cuadro suelto en la octava equivocada no mueve el resultado', () => {
    const take = frames([...repeat(67, 6), 79, ...repeat(67, 6)]);
    expect(takePitch(take)).toBe(67);
  });

  it('null si no hubo voz o fue demasiado poca', () => {
    expect(takePitch(frames(repeat(null, 10)))).toBeNull();
    expect(takePitch(frames([67, 67, 67, 67, 67]))).toBeNull();
  });
});
