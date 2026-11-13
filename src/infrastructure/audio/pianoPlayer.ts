import { IAudioPlayer } from '@/domain/audio/IAudioPlayer';

import { createPianoSamplerPlayer } from './PianoSamplerPlayer';

/**
 * Única instancia del motor de piano de la app.
 *
 * Es un singleton de módulo a propósito: decodificar el banco de muestras cuesta
 * memoria y cientos de ms, así que Librería y Ejercicios comparten el mismo
 * contexto de audio en vez de cargar dos. `load()` está memoizado dentro del
 * motor, de modo que cada pantalla puede llamarlo al montar sin coordinarse con
 * las demás.
 */
export const pianoPlayer: IAudioPlayer = createPianoSamplerPlayer();
