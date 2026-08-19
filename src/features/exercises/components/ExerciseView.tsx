import { Exercise, IntervalId } from '@/domain/ear-training';

import { NotePlayer } from '../hooks/useNotePlayer';
import { IntervalExercise } from './IntervalExercise';
import { NoteExercise } from './NoteExercise';

interface ExerciseViewProps {
  exercise: Exercise;
  selected: IntervalId | null;
  revealed: boolean;
  player: NotePlayer;
  onSelect: (interval: IntervalId) => void;
}

/**
 * Elige la vista según el tipo de ejercicio. Existe para que la pantalla de la
 * ronda no tenga que saber qué tipos hay: cuando se añada un tercero, el cambio
 * es esta línea y no la pantalla.
 */
export function ExerciseView({ exercise, ...rest }: ExerciseViewProps) {
  return exercise.kind === 'interval' ? (
    <IntervalExercise exercise={exercise} {...rest} />
  ) : (
    <NoteExercise exercise={exercise} {...rest} />
  );
}
