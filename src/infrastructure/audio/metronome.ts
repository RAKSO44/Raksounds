import { IMetronome } from '@/domain/audio';

import { createMetronomePlayer } from './MetronomePlayer';

/** Única instancia del metrónomo (ver `pianoPlayer.ts`, mismo motivo). */
export const metronome: IMetronome = createMetronomePlayer();
