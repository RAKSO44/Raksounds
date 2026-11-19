import { useCallback, useEffect, useRef } from 'react';

import { SoundEffect } from '@/domain/audio';
import { isRoundCleared } from '@/domain/ear-training';
// Punto de composición con la implementación real de los efectos.
import { soundEffects } from '@/infrastructure/audio/soundEffects';
import { useSettingsStore } from '@/shared/settings';

/**
 * Efectos de sonido de los ejercicios. Precarga al montar (memoizado en el
 * motor, así que cada pantalla puede llamarlo) y devuelve el disparador.
 * Respeta el ajuste "Efectos de sonido": se lee al disparar (no al montar),
 * igual que la háptica, para que el disparador no cambie de identidad.
 */
export function useSoundEffects(): (effect: SoundEffect) => void {
  useEffect(() => {
    soundEffects.load();
  }, []);

  return useCallback((effect: SoundEffect) => {
    if (!useSettingsStore.getState().soundEffectsEnabled) return;
    soundEffects.play(effect);
  }, []);
}

/**
 * Suena UNA vez al aparecer el resultado de una ronda: "superada" o "no
 * superada" según `isRoundCleared`, el mismo corte que colorea el porcentaje.
 * Con `null` (resumen ilegible) no suena nada.
 */
export function useRoundEndSound(accuracy: number | null): void {
  const play = useSoundEffects();
  // El resultado no cambia mientras la pantalla vive; el ref evita que un
  // repintado (o el doble efecto del modo estricto) lo haga sonar otra vez.
  const played = useRef(false);

  useEffect(() => {
    if (accuracy === null || played.current) return;
    played.current = true;
    play(isRoundCleared(accuracy) ? 'cleared' : 'failed');
  }, [accuracy, play]);
}
