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
