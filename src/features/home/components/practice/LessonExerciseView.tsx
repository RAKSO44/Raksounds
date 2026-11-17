import { LessonExercise } from '@/domain/lessons';

import { ChoiceExerciseView } from './ChoiceExerciseView';
import { ClipChoiceExerciseView } from './ClipChoiceExerciseView';
import { SequenceExerciseView } from './SequenceExerciseView';
import { TapExerciseView } from './TapExerciseView';
import { ExerciseViewProps } from './types';

/**
 * Elige la vista según la mecánica. La pantalla de práctica no sabe qué
 * mecánicas hay: añadir una nueva (los módulos de figuras) es tocar aquí.
 */
export function LessonExerciseView({ exercise, ...rest }: ExerciseViewProps<LessonExercise>) {
  switch (exercise.mechanic) {
    case 'choice':
      return <ChoiceExerciseView exercise={exercise} {...rest} />;
    case 'clip-choice':
      return <ClipChoiceExerciseView exercise={exercise} {...rest} />;
    case 'sequence':
      return <SequenceExerciseView exercise={exercise} {...rest} />;
    case 'tap':
      return <TapExerciseView exercise={exercise} {...rest} />;
  }
}
