import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  ExerciseKind,
  ExerciseMode,
  INTERVALS,
  IntervalId,
  IntervalQuality,
  LevelTier,
} from '@/domain/ear-training';
import { PushButtonTone } from '@/shared/design-system';

/** Etiquetas de UI en español. Las claves de dominio permanecen en inglés. */

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const QUALITY_LABELS: Record<IntervalQuality, string> = {
  perfect: 'justa',
  major: 'mayor',
  minor: 'menor',
  augmented: 'aumentada',
};

/** Número ordinal del intervalo: "5ª", "8ª". */
export function intervalNumberLabel(id: IntervalId): string {
  return `${INTERVALS[id].number}ª`;
}

/** Calidad del intervalo: "justa", "menor". */
export function intervalQualityLabel(id: IntervalId): string {
  return QUALITY_LABELS[INTERVALS[id].quality];
}

/** Nombre completo: "5ª justa", "3ª menor". */
export function intervalLabel(id: IntervalId): string {
  return `${intervalNumberLabel(id)} ${intervalQualityLabel(id)}`;
}

/**
 * Forma compacta para listas donde el espacio manda (resumen de un nivel).
 * El tritono se nombra con sus dos lecturas porque así se estudia.
 */
export const INTERVAL_COMPACT_LABELS: Record<IntervalId, string> = {
  m2: '2ªm',
  M2: '2ªM',
  m3: '3ªm',
  M3: '3ªM',
  P4: '4ªJ',
  TT: '4ªaum/5ªdism',
  P5: '5ªJ',
  m6: '6ªm',
  M6: '6ªM',
  m7: '7ªm',
  M7: '7ªM',
  P8: '8ªJ',
};

export const MODE_LABELS: Record<ExerciseMode, string> = {
  mixed: 'Mixto',
  interval: 'Identificación de intervalo',
  note: 'Identificación de nota',
};

export const MODE_DESCRIPTIONS: Record<ExerciseMode, string> = {
  mixed: 'Los dos tipos, mezclados',
  interval: 'Suenan dos notas: di qué intervalo forman',
  note: 'Encuentra la nota que está al intervalo pedido',
};

/**
 * El modo mezclado se pinta como una columna a la derecha de los dos tipos
 * sueltos, así que su nombre va letra a letra en vertical.
 */
export const MIXED_VERTICAL_LABEL = MODE_LABELS.mixed.toUpperCase().split('').join('\n');

export const MODE_ICONS: Record<ExerciseMode, IconName> = {
  mixed: 'shuffle-variant',
  interval: 'ruler',
  note: 'music-note',
};

/**
 * Color de cada franja de dificultad, expresado como tono del design system.
 * Es el color con el que se ve un nivel SELECCIONADO (en reposo todos son
 * neutros): verde los tres primeros, amarillo los dos intermedios y rojo los
 * dos últimos.
 */
export const TIER_TONES: Record<LevelTier, PushButtonTone> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

interface FeedbackDetailInput {
  readonly kind: ExerciseKind;
  readonly correct: boolean;
  /** Intervalo correcto del ejercicio. */
  readonly answer: IntervalId;
  /** Lo que el usuario eligió. */
  readonly chosen: IntervalId;
}

/**
 * Segunda línea de la hoja de corrección.
 *
 * Al fallar, lo útil depende del ejercicio: en "identificación de intervalo" la
 * pregunta ERA cuál es el intervalo, así que se nombra el correcto; en
 * "identificación de nota" el intervalo pedido ya estaba en el enunciado, y lo
 * que el usuario no sabe es qué acaba de marcar.
 */
export function feedbackDetailLabel({
  kind,
  correct,
  answer,
  chosen,
}: FeedbackDetailInput): string {
  if (correct) return intervalLabel(answer);
  if (kind === 'note') return `Marcaste ${intervalLabel(chosen)}`;
  return `Era ${intervalLabel(answer)}`;
}

/** Enunciado del ejercicio de identificación de nota. */
export function noteQuestionLabel(id: IntervalId): string {
  return `¿Cuál de estas es su ${intervalLabel(id)}?`;
}

/** Letra que identifica a una opción sonora: A, B, C… */
export function optionLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}
