import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/shared/settings';

/**
 * Envoltorio fino sobre expo-haptics. expo-haptics delega en el mejor actuador
 * disponible del dispositivo (Taptic Engine en iOS, motor lineal LRA en Android
 * moderno; cae a vibración ERM en equipos antiguos), así que aquí solo elegimos
 * la *intensidad* y dejamos que la plataforma resuelva el hardware.
 *
 * Todas las llamadas son "dispara y olvida" y nunca propagan errores: en web o
 * en equipos sin motor háptico simplemente no hacen nada.
 */

function safe(run: () => Promise<unknown>): void {
  if (Platform.OS === 'web') return;
  // Interruptor global: si el usuario apagó la háptica en Configuración, ninguna
  // interacción vibra. Se lee del store (no-hook) para gatear en el punto único.
  if (!useSettingsStore.getState().hapticsEnabled) return;
  try {
    run().catch(() => {
      /* dispositivo sin háptica: ignorar */
    });
  } catch {
    /* módulo háptico no disponible (p. ej. en tests): ignorar */
  }
}

/**
 * Golpe seco: la única textura háptica de la app. Como Duolingo, buscamos un
 * "click" firme y CORTO (nada de vibrado prolongado). `Rigid` es la variante
 * más seca de expo-haptics; `Medium`/`Heavy` se sienten más como un zumbido en
 * los motores LRA de Android, por eso no se usan.
 */
function dryHit(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
}

/**
 * Un único golpe seco. Para botones NO alzados (filas de listas, toggles):
 * no tienen relieve 3D, así que dan un solo impacto en vez de un par.
 */
export function hapticTap(): void {
  dryHit();
}

/**
 * Golpe seco al PRESIONAR un botón alzado (relieve 3D). Junto con
 * `hapticPressOut` forma el par "baja / sube" característico de Duolingo.
 */
export function hapticPressIn(): void {
  dryHit();
}

/** Golpe seco al SOLTAR un botón alzado (el segundo impacto del par). */
export function hapticPressOut(): void {
  dryHit();
}
