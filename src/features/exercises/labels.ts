import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  EXERCISE_LEVELS,
  ExerciseKind,
  ExerciseLevel,
  ExerciseMode,
  intervalBySemitones,
  INTERVALS,
  IntervalId,
  IntervalQuality,
  LevelTier,
} from '@/domain/ear-training';
import { formatNoteName, Note } from '@/domain/music-theory';
import {
  CHORD_LEVELS,
  ChordFunction,
  SingingEvaluation,
  SingingExercise,
  SingingKind,
  SingingTarget,
  SingingVerdict,
  sungChordFunction,
  sungNoteName,
} from '@/domain/singing';
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

/**
 * Resumen de un nivel de intervalos. A partir del segundo es incremental
 * ("+ 3ªM y 3ªm"): lo que importa al elegir es qué se suma, no repetir toda la
 * lista acumulada.
 */
export function intervalLevelSummary(level: ExerciseLevel): string {
  const added = level.added.map((interval) => INTERVAL_COMPACT_LABELS[interval]).join(' y ');
  return level.number === 1 ? added : `+ ${added}`;
}

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

/** Título de la hoja de corrección de los ejercicios auditivos. */
export function feedbackTitleLabel(correct: boolean): string {
  return correct ? '¡Correcto!' : 'Casi';
}

/** Enunciado del ejercicio de identificación de nota. */
export function noteQuestionLabel(id: IntervalId): string {
  return `¿Cuál de estas es su ${intervalLabel(id)}?`;
}

/** Letra que identifica a una opción sonora: A, B, C… */
export function optionLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

// ── Entonación ──────────────────────────────────────────────────────────────

export const SINGING_LABELS: Record<SingingKind, string> = {
  singInterval: 'Entonación de intervalos',
  singNote: 'Entonación de notas',
};

export const SINGING_DESCRIPTIONS: Record<SingingKind, string> = {
  singInterval: 'Suena una nota: canta el intervalo pedido',
  singNote: 'Suena un acorde: canta la nota que te piden',
};

export const SINGING_ICONS: Record<SingingKind, IconName> = {
  singInterval: 'stairs-up',
  singNote: 'microphone-variant',
};

/**
 * Qué trae cada nivel de entonación de notas. No son acumulativos como los de
 * intervalos: cada uno cambia lo que suena, así que se describe entero.
 */
export const CHORD_LEVEL_SUMMARIES: Record<number, string> = {
  1: 'Una nota: cántala igual',
  2: 'Dos notas: con 3ª o 5ª',
  3: 'Tríadas mayores y menores',
  4: 'Tríadas invertidas',
  5: 'Cuatríadas: maj7, m7 y 7',
};

export const CHORD_FUNCTION_LABELS: Record<ChordFunction, string> = {
  root: 'fundamental',
  third: '3ª',
  fifth: '5ª',
  seventh: '7ª',
};

/** Enunciado de un ejercicio de entonación. */
export function singingQuestionLabel(exercise: SingingExercise): string {
  if (exercise.kind === 'singInterval')
    return `Canta una ${intervalLabel(exercise.interval)} ascendente`;
  if (exercise.tones.length === 1) return 'Canta la misma nota';
  return `Canta la ${CHORD_FUNCTION_LABELS[exercise.targetFunction]}`;
}

/** Rótulo de la tecla que hace sonar lo que hay que analizar. */
export function chordKeyCaption(toneCount: number): string {
  if (toneCount === 1) return 'Nota';
  if (toneCount === 2) return 'Dos notas';
  return 'Acorde';
}

const SINGING_TITLES: Record<SingingVerdict, string> = {
  correct: '¡Afinado!',
  close: 'Casi',
  wrong: 'Esa no era',
};

export function singingTitleLabel(verdict: SingingVerdict): string {
  return SINGING_TITLES[verdict];
}

/** Desviación en palabras: "12 cents bajo", "justo en el centro". */
export function centsLabel(centsOff: number): string {
  const distance = Math.abs(centsOff);
  // Bajo ±5 cents el oído no lo distingue: decir "3 cents alto" sería ruido.
  if (distance <= 5) return 'justo en el centro';
  return `${distance} cents ${centsOff < 0 ? 'bajo' : 'alto'}`;
}

/**
 * Segunda línea de la hoja de corrección de entonación.
 *
 * Al fallar no basta con "incorrecto": se dice QUÉ se cantó, en el idioma del
 * ejercicio (el intervalo que salió, o la otra nota del acorde), porque es lo
 * que permite corregir el oído.
 */
export function singingDetailLabel(
  exercise: SingingExercise,
  evaluation: SingingEvaluation,
  format: (note: Note) => string,
): string {
  const target = format(exercise.target);
  if (evaluation.verdict !== 'wrong') return `${target}, ${centsLabel(evaluation.centsOff)}`;

  if (exercise.kind === 'singInterval') {
    const sungInterval = intervalBySemitones(evaluation.sungOffset);
    const sung = sungInterval === null ? 'la nota base' : `una ${intervalLabel(sungInterval)}`;
    return `Cantaste ${sung}; era ${target}`;
  }

  const fn = sungChordFunction(exercise, evaluation);
  const sung =
    fn === null
      ? formatNoteName(sungNoteName(exercise, evaluation))
      : `la ${CHORD_FUNCTION_LABELS[fn]}`;
  return `Cantaste ${sung}; era ${target}`;
}

/** Etiqueta corta de un objetivo fallado, para el resumen ("5ªJ", "3ª"). */
export function singingTargetLabel(target: SingingTarget): string {
  return target.kind === 'interval'
    ? INTERVAL_COMPACT_LABELS[target.interval]
    : CHORD_FUNCTION_LABELS[target.fn];
}

/**
 * Texto bajo el micrófono: qué hacer ahora o por qué la última toma no sirvió.
 * Un problema manda sobre la instrucción, porque explica por qué no avanzó.
 * La falta de permiso NO se explica aquí: se resuelve con un diálogo que
 * ofrece activarlo (ver `SingingRoundScreen`).
 */
export function micHintLabel(
  status: 'idle' | 'starting' | 'listening',
  problem: 'denied' | 'unavailable' | 'silent' | null,
): string {
  if (status === 'listening') return 'Te escucho… calla al terminar';
  if (status === 'starting') return 'Abriendo el micrófono…';
  if (problem === 'unavailable') return 'No se pudo abrir el micrófono';
  if (problem === 'silent') return 'No te escuché bien. Toca el micrófono y vuelve a cantar';
  return 'Toca el micrófono y canta';
}

/**
 * Hacia dónde tiende la voz en el resumen. Bajo ±8 cents de media no se
 * menciona tendencia: es menos de lo que distingue un oído entrenado.
 */
export function tendencyLabel(tendencyCents: number | null): string {
  if (tendencyCents === null) {
    return 'Esta vez no diste con la nota: escucha bien la referencia antes de cantar.';
  }
  const distance = Math.round(Math.abs(tendencyCents));
  if (distance <= 8) return 'Centrada: tu voz no tiende ni a subirse ni a quedarse baja.';
  return tendencyCents < 0
    ? `Tu voz tiende a quedarse baja (${distance} cents de media).`
    : `Tu voz tiende a subirse (${distance} cents de media).`;
}

/** Fila de la pantalla de niveles, ya traducida a texto. */
export interface LevelRow {
  readonly number: number;
  readonly tier: LevelTier;
  readonly summary: string;
}

/**
 * Niveles que se ofrecen para un modo: los 7 de intervalos para todo lo que
 * trabaja intervalos (identificar o cantar), los 5 de acordes para cantar notas.
 */
export function levelRowsFor(mode: ExerciseMode | SingingKind): readonly LevelRow[] {
  if (mode === 'singNote') {
    return CHORD_LEVELS.map((level) => ({
      number: level.number,
      tier: level.tier,
      summary: CHORD_LEVEL_SUMMARIES[level.number] ?? '',
    }));
  }
  return EXERCISE_LEVELS.map((level) => ({
    number: level.number,
    tier: level.tier,
    summary: intervalLevelSummary(level),
  }));
}
