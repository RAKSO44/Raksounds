import { create } from 'zustand';

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
 * deben sobrevivir a la navegación, justo el caso que el store liviano cubre.
 *
 * De momento vive solo en memoria (se reinicia al cerrar la app); la
 * persistencia entre sesiones llegará junto con el resto de almacenamiento.
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  hapticsEnabled: true,
  themeMode: 'system',
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setThemeMode: (themeMode) => set({ themeMode }),
}));
