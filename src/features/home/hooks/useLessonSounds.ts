import { useCallback, useEffect } from 'react';

import { SoundEffect } from '@/domain/audio/ISoundEffects';
// Punto de composición con la implementación real de los efectos.
import { soundEffects } from '@/infrastructure/audio/soundEffects';
import { useSettingsStore } from '@/shared/settings';

/**
 * Efectos de acierto/error y de fin de práctica en las lecciones. Es el mismo
 * motor que el de Ejercicios y respeta el mismo ajuste "Efectos de sonido".
 */
export function useLessonSounds(): (effect: SoundEffect) => void {
  useEffect(() => {
    soundEffects.load();
  }, []);

  return useCallback((effect: SoundEffect) => {
    if (!useSettingsStore.getState().soundEffectsEnabled) return;
    soundEffects.play(effect);
  }, []);
}
