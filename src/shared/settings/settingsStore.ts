import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_VOLUME } from '@/domain/audio/volume';

import { mmkvStorage } from './mmkvStorage';

/** Preferencia de apariencia: forzar claro/oscuro o seguir al sistema. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  /** Si está en `false`, ninguna interacción dispara háptica. */
  hapticsEnabled: boolean;
  /** Modo de color elegido por el usuario. `system` sigue al SO. */
  themeMode: ThemeMode;
  /**
   * Volumen propio de la app (0–1), independiente del volumen del sistema.
   * 0.5 es el volumen normal; la curva vive en `domain/audio/volume`.
   */
  volume: number;
  setHapticsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setVolume: (volume: number) => void;
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
      volume: DEFAULT_VOLUME,
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        hapticsEnabled: state.hapticsEnabled,
        themeMode: state.themeMode,
        volume: state.volume,
      }),
    },
  ),
);
