import { LessonExercise } from './exercise';
import { generateModule1Practice } from './module1Practice';
import { generateModule2Practice } from './module2Practice';
import { seededRandom } from './random';
import { ModuleId } from './stages';

/**
 * Genera el intento de práctica de un módulo a partir de una semilla: la misma
 * semilla da los mismos 15 ejercicios.
 */
export function generatePractice(id: ModuleId, seed: number): LessonExercise[] {
  const random = seededRandom(seed);
  switch (id) {
    case 'notes':
      return generateModule1Practice(random);
    case 'pulse':
      return generateModule2Practice(random);
  }
}

/**
 * "Reintentar fallos": solo las posiciones que se fallaron, pero NUEVAS (otra
 * semilla da otra nota marcada, otra fila…). Se repite el tipo de ejercicio,
 * no la respuesta que ya se vio en la corrección.
 */
export function generateRetry(
  id: ModuleId,
  seed: number,
  positions: readonly number[],
): LessonExercise[] {
  return generatePractice(id, seed).filter((exercise) => positions.includes(exercise.position));
}
