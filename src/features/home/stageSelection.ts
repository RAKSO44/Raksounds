import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/settings';

interface StageSelectionState {
  /** Etapa elegida en la pantalla de etapas, pendiente de que el Home la muestre. */
  pending: number | null;
  /**
   * Última etapa con la que se interactuó (elegirla en la lista o tocar uno de
   * sus módulos). Se guarda en el dispositivo: al abrir la app, la ruta
   * arranca en ella.
   */
  last: number;
  /** Se eligió una etapa en la lista: el Home saltará a ella al volver. */
  select: (index: number) => void;
  /** Se interactuó con una etapa desde la propia ruta. */
  touch: (index: number) => void;
  clear: () => void;
}

/**
 * La etapa del Home entre pantallas y entre sesiones. `pending` es el puente
 * de ida y vuelta con la pantalla de etapas (no se persiste); `last` se guarda
 * con MMKV, síncrono, para que la ruta se coloque sin esperar.
 */
export const useStageSelectionStore = create<StageSelectionState>()(
  persist(
    (set) => ({
      pending: null,
      last: 0,
      select: (index) => set({ pending: index, last: index }),
      touch: (index) => set({ last: index }),
      clear: () => set({ pending: null }),
    }),
    {
      name: 'home-stage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ last: state.last }),
    },
  ),
);
