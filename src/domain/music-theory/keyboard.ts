import { midiPitchClass } from './note';

/**
 * Geometría de un teclado de piano, independiente de cómo se dibuje.
 *
 * Todas las medidas van en "anchos de tecla blanca": la UI solo multiplica por
 * los píxeles que tenga una tecla blanca en pantalla.
 */

/**
 * Clases de altura de las teclas negras. En cada octava hay 7 blancas y 5
 * negras; las negras faltan entre E–F y B–C (semitonos naturales).
 */
const BLACK_PITCH_CLASSES: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

/** Ancho de una tecla negra respecto a una blanca (proporción de un piano real). */
export const BLACK_KEY_WIDTH = 0.6;

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(midiPitchClass(midi));
}

export interface KeyboardKey {
  readonly midi: number;
  readonly black: boolean;
  /** Borde izquierdo, en anchos de tecla blanca desde el inicio del teclado. */
  readonly left: number;
  /** Ancho, en anchos de tecla blanca (1 para las blancas). */
  readonly width: number;
}

export interface KeyboardLayout {
  /** Blancas primero y después negras: es el orden de pintado (las negras encima). */
  readonly keys: readonly KeyboardKey[];
  readonly whiteKeyCount: number;
}

/**
 * Construye el teclado de `low` a `high` (inclusive). Ambos extremos deben ser
 * teclas blancas: un teclado no empieza ni termina en media tecla negra.
 *
 * Cada negra se centra sobre la juntura de las dos blancas entre las que cae.
 */
export function buildKeyboard(low: number, high: number): KeyboardLayout {
  if (isBlackKey(low) || isBlackKey(high)) {
    throw new Error('El teclado debe empezar y terminar en tecla blanca');
  }
  if (high < low) throw new Error('Rango de teclado vacío');

  const whites: KeyboardKey[] = [];
  const blacks: KeyboardKey[] = [];
  for (let midi = low; midi <= high; midi += 1) {
    if (isBlackKey(midi)) {
      // Juntura = borde derecho de la blanca anterior (ya colocada).
      blacks.push({
        midi,
        black: true,
        left: whites.length - BLACK_KEY_WIDTH / 2,
        width: BLACK_KEY_WIDTH,
      });
    } else {
      whites.push({ midi, black: false, left: whites.length, width: 1 });
    }
  }
  return { keys: [...whites, ...blacks], whiteKeyCount: whites.length };
}

/** Siguiente tecla blanca estrictamente por encima (`step` = 1) o por debajo (-1). */
function nextWhite(midi: number, step: 1 | -1): number {
  let next = midi + step;
  while (isBlackKey(next)) next += step;
  return next;
}

/**
 * Rango de teclado para mostrar unas notas con aire alrededor: una tecla blanca
 * libre a cada lado y, si el resultado es más corto que `minWhiteKeys`, se
 * alarga alternando arriba y abajo para que el teclado no cambie de tamaño
 * según el acorde.
 */
export function keyboardRangeFor(
  midis: readonly number[],
  minWhiteKeys: number,
): { readonly low: number; readonly high: number } {
  if (midis.length === 0) throw new Error('Hacen falta notas para elegir el rango');
  let low = nextWhite(Math.min(...midis), -1);
  let high = nextWhite(Math.max(...midis), 1);

  let whiteCount = buildKeyboard(low, high).whiteKeyCount;
  let growUp = true;
  while (whiteCount < minWhiteKeys) {
    if (growUp) high = nextWhite(high, 1);
    else low = nextWhite(low, -1);
    growUp = !growUp;
    whiteCount += 1;
  }
  return { low, high };
}
