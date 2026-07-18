import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

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
  try {
    run().catch(() => {
      /* dispositivo sin háptica: ignorar */
    });
  } catch {
    /* módulo háptico no disponible (p. ej. en tests): ignorar */
  }
}

/** Golpe firme al presionar un botón (sensación de "click" fuerte). */
export function hapticPressIn(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Golpe seco y breve al soltar (el "pop" de retorno). */
export function hapticPressOut(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
}
