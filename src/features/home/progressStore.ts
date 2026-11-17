import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  completeTheory,
  ModuleId,
  progressOf,
  ProgressMap,
  recordPractice,
} from '@/domain/lessons';
import { mmkvStorage } from '@/shared/settings';

interface LessonProgressState {
  modules: ProgressMap;
  completeTheory: (id: ModuleId) => void;
  recordPractice: (id: ModuleId, score: number) => void;
}

/**
 * Progreso de la ruta del Home, guardado en el dispositivo con MMKV (el mismo
 * almacenamiento síncrono que los ajustes: la ruta se pinta ya con su estado
 * real, sin parpadear). Las reglas —qué completa un módulo, qué desbloquea—
 * viven en `domain/lessons/progress.ts`; aquí solo se guardan.
 *
 * `version` permite migrar el formato hacia adelante cuando se añadan campos
 * (o cuando el progreso pase a Supabase).
 */
export const useLessonProgressStore = create<LessonProgressState>()(
  persist(
    (set) => ({
      modules: {},
      completeTheory: (id) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: completeTheory(progressOf(state.modules, id), new Date().toISOString()),
          },
        })),
      recordPractice: (id, score) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: recordPractice(progressOf(state.modules, id), score, new Date().toISOString()),
          },
        })),
    }),
    {
      name: 'lesson-progress',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ modules: state.modules }),
    },
  ),
);
