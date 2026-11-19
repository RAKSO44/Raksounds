import { ISoundEffects } from '@/domain/audio';

import { createSoundEffectsPlayer } from './SoundEffectsPlayer';

/** Única instancia de los efectos de la app (ver `pianoPlayer.ts`, mismo motivo). */
export const soundEffects: ISoundEffects = createSoundEffectsPlayer();
