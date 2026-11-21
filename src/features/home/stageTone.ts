import { PushButtonTone } from '@/shared/design-system';

/**
 * Color de cada etapa de la ruta: su tarjeta, sus nodos y los botones de sus
 * módulos. Nunca el morado de marca (es el de la cabecera, y la tarjeta se
 * confundiría con ella) ni el dorado (es el color del progreso). Ninguna
 * etapa repite color: una etapa nueva necesita un tono nuevo en esta lista.
 */
const STAGE_TONES: readonly PushButtonTone[] = ['accentAlt', 'secondary', 'accent', 'success'];

export function stageTone(stageNumber: number): PushButtonTone {
  return STAGE_TONES[(stageNumber - 1) % STAGE_TONES.length] ?? 'secondary';
}
