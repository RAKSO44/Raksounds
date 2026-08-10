import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

/**
 * Almacenamiento persistente de preferencias con MMKV: es síncrono, así que
 * el store se rehidrata antes del primer render y no hay parpadeo del tema al
 * abrir la app (a diferencia de AsyncStorage, que es asíncrono).
 *
 * MMKV es un módulo nativo; en el entorno de tests (Jest) se mockea, ver
 * jest.setup.js. Se expone como `StateStorage` para el middleware `persist`.
 *
 * Este archivo es la implementación nativa (iOS/Android). En web, Metro
 * resuelve automáticamente `mmkvStorage.web.ts` en su lugar — ver ese archivo
 * y `.claude/rules/architecture.md`.
 */
const storage = createMMKV({ id: 'raksound-settings' });

export const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.remove(name),
};
