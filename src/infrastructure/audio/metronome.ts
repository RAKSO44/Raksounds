import { IMetronome } from '@/domain/audio';

import { sharedAudioContext } from './audioEngine';
import { createMetronomePlayer } from './MetronomePlayer';

/**
 * Única instancia del metrónomo (ver `pianoPlayer.ts`, mismo motivo), en el
 * contexto de audio del piano: lo que suena encima del pulso va en su reloj.
 */
export const metronome: IMetronome = createMetronomePlayer(sharedAudioContext);
