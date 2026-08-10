import { StateStorage } from 'zustand/middleware';

/**
 * Contraparte web de `mmkvStorage.ts`. Metro resuelve `.web.ts` automáticamente
 * al compilar para esa plataforma (misma ruta de import, sin tocar
 * `settingsStore.ts`), así que solo hace falta igualar la forma `StateStorage`.
 *
 * MMKV es un módulo nativo (JSI): no existe build para navegador. `localStorage`
 * es el equivalente síncrono en web, así que no hay parpadeo del tema al
 * abrir la página por la misma razón que en nativo (ver mmkvStorage.ts).
 */
export const mmkvStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};
