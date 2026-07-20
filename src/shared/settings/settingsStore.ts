import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './mmkvStorage';

/** Preferencia de apariencia: forzar claro/oscuro o seguir al sistema. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  /** Si está en `false`, ninguna interacción dispara háptica. */
  hapticsEnabled: boolean;
  /** Modo de color elegido por el usuario. `system` sigue al SO. */
  themeMode: ThemeMode;
  setHapticsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

/**
 * Estado global de ajustes de la app. Es el primer uso de Zustand del proyecto:
 * estas preferencias cruzan features (tema y háptica afectan a toda la UI) y
 * deben sobrevivir a la navegación.
 *
 * Se persisten en disco con MMKV (`persist` + `mmkvStorage`): lo que el usuario
 * configure se conserva entre sesiones, incluso tras cerrar la app. Solo se
 * guardan las preferencias (no las acciones), vía `partialize`.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      themeMode: 'system',
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        hapticsEnabled: state.hapticsEnabled,
        themeMode: state.themeMode,
      }),
    },
  ),
);
