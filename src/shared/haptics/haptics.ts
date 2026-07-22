import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/shared/settings';

/**
 * Envoltorio fino sobre expo-haptics.
 *
 * IMPORTANTE — por qué NO usamos `impactAsync` en Android:
 * en Android, `impactAsync` NO llega al motor háptico afinado por el fabricante;
 * construye a mano un `VibrationEffect.createWaveform(timings, amplitudes)`. Para
 * `Rigid` eso son 43 ms de vibración a amplitud 50/255 — un zumbido largo y flojo,
 * no un click. Por eso se sentía "feo" por más que subiéramos el estilo: `Medium`
 * y `Rigid` son literalmente la MISMA waveform, y `Heavy` solo la alarga a 60 ms.
 *
 * `performAndroidHapticsAsync` sí pasa por `View.performHapticFeedback(...)`, que
 * delega en la capa háptica del sistema y por tanto en la curva que el fabricante
 * afinó para su LRA (en HyperOS/POCO es la misma ruta que usan el teclado y apps
 * como Duolingo). De ahí salen los golpes SECOS y FUERTES.
 *
 * En iOS `impactAsync` ya va al Taptic Engine, así que ahí se mantiene.
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
 * Golpe seco del sistema. `type` es la constante Android a usar; en iOS todas
 * caen en el impacto `Rigid`, que allí ya es un click corto del Taptic Engine.
 */
function dryHit(type: Haptics.AndroidHaptics): void {
  if (Platform.OS === 'android') {
    safe(() => Haptics.performAndroidHapticsAsync(type));
    return;
  }
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
}

/**
 * Un único golpe seco. Para botones NO alzados (filas de listas, toggles):
 * no tienen relieve 3D, así que dan un solo impacto en vez de un par.
 *
 * `Virtual_Key` es el click estándar de "pulsé un control" del sistema.
 */
export function hapticTap(): void {
  dryHit(Haptics.AndroidHaptics.Virtual_Key);
}

/**
 * Golpe seco al PRESIONAR un botón alzado (relieve 3D). Es el ÚNICO impacto
 * del botón: al soltar no hay háptica (convención del proyecto — un solo golpe
 * por pulsación, no un par baja/sube).
 *
 * `Keyboard_Press` es el golpe que el sistema afina para tecla-abajo: un
 * impacto DISTINTO y seco, en vez de la vibración larga y floja de
 * `impactAsync` en Android.
 */
export function hapticPressIn(): void {
  dryHit(Haptics.AndroidHaptics.Keyboard_Press);
}
