import { RandomSource } from '../ear-training';

/**
 * Azar reproducible para las prácticas del Home. Una sesión se genera entera a
 * partir de UNA semilla: la misma semilla da exactamente los mismos 15
 * ejercicios (es lo que permite fijarlos en los tests y, más adelante,
 * reanudar un intento sin regenerarlo).
 */

/**
 * Generador mulberry32: 32 bits de estado, suficiente para barajar opciones y
 * mucho más rápido y simple que cualquier alternativa criptográfica, que aquí
 * no aporta nada.
 */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero en [min, max], ambos incluidos. */
export function randomInt(min: number, max: number, random: RandomSource): number {
  // Math.min protege del caso límite random() === 1 de una fuente mal portada.
  return min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
}

export function pickOne<T>(items: readonly T[], random: RandomSource): T {
  if (items.length === 0) throw new Error('pickOne: lista vacía');
  return items[randomInt(0, items.length - 1, random)];
}

/** Copia barajada (Fisher–Yates). No toca el original. */
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i, random);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Baraja hasta que el orden NO coincida con el de partida. Para fichas que hay
 * que ordenar: si salieran ya ordenadas, el ejercicio se respondería solo.
 */
export function shuffleUnordered<T>(items: readonly T[], random: RandomSource): T[] {
  if (items.length < 2) return [...items];
  for (;;) {
    const shuffled = shuffle(items, random);
    if (shuffled.some((item, index) => item !== items[index])) return shuffled;
  }
}
