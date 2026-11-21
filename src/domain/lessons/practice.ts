import { LessonExercise } from './exercise';
import { generateModule1Practice } from './module1Practice';
import { generateModule2Practice } from './module2Practice';
import { generateModule3Practice } from './module3Practice';
import { seededRandom } from './random';
import { ModuleId } from './stages';

/**
 * Genera el intento de práctica de un módulo a partir de una semilla: la misma
 * semilla da los mismos ejercicios.
 */
export function generatePractice(id: ModuleId, seed: number): LessonExercise[] {
  const random = seededRandom(seed);
  switch (id) {
    case 'notes':
      return generateModule1Practice(random);
    case 'pulse':
      return generateModule2Practice(random);
    case 'figures':
      return generateModule3Practice(random);
  }
}

/** ¿El módulo ya tiene ejercicios? Sin ellos, su entrada de práctica avisa "Próximamente". */
export function hasPractice(id: ModuleId): boolean {
  return practiceLength(id) > 0;
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

/**
 * Ejercicios de un intento completo del módulo. La plantilla es fija, así que
 * no depende de la semilla.
 */
export function practiceLength(id: ModuleId): number {
  return generatePractice(id, 0).length;
}
