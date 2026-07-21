/**
 * Volumen propio de la app, independiente del volumen del sistema.
 *
 * El usuario mueve un deslizable de 0 a 1 y el punto medio (0.5) es el volumen
 * "normal": el mismo con el que sonaba la app antes de existir este ajuste. Por
 * eso la curva NO va de 0 a 1, sino de silencio a `MAX_GAIN`, pasando por 1
 * exactamente en la mitad del recorrido.
 */

/** Posición del deslizable al instalar la app: volumen normal (ganancia 1). */
export const DEFAULT_VOLUME = 0.5;

/**
 * Ganancia con el deslizable al tope (+12 dB). No satura: el bus maestro pasa
 * por un limitador de "soft clip", así que subir aquí suena más fuerte y no
 * distorsionado.
 */
const MAX_GAIN = 4;

/** Exponente de la curva: 2 es lo que hace que 0.5 caiga justo en ganancia 1. */
const CURVE = Math.log(MAX_GAIN) / Math.log(1 / DEFAULT_VOLUME);

/**
 * Convierte la posición del deslizable (0–1) en ganancia lineal para el bus de
 * audio. La curva es exponencial —no lineal— porque el oído percibe el volumen
 * en escala logarítmica: repartir la ganancia linealmente concentraría todo el
 * cambio audible en el primer tramo del recorrido.
 *
 * - `0` → 0 (silencio total)
 * - `0.5` → 1 (volumen normal)
 * - `1` → 4 (+12 dB)
 */
export function volumeToGain(volume: number): number {
  const clamped = Math.min(1, Math.max(0, volume));
  return clamped === 0 ? 0 : (clamped / DEFAULT_VOLUME) ** CURVE;
}
