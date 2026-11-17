import { LessonAnswer } from '@/domain/lessons';

import { ClipPlayer } from '../../hooks/useClipPlayer';

/** Lo que toda vista de ejercicio recibe de la sesión de práctica. */
export interface ExerciseViewProps<E> {
  exercise: E;
  /** `true` tras corregir: la vista muestra la solución y deja de aceptar cambios. */
  revealed: boolean;
  player: ClipPlayer;
  /** Respuesta lista para corregir, o `null` si aún no se puede confirmar. */
  onAnswer: (answer: LessonAnswer | null) => void;
}
