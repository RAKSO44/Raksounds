import { ComponentType } from 'react';

import { ModuleId } from '@/domain/lessons';

import { BpmPage } from './BpmPage';
import { NotesOctavePage } from './NotesOctavePage';
import { NotesOrderPage } from './NotesOrderPage';
import { NotesWhatPage } from './NotesWhatPage';
import { PulseFeelPage } from './PulseFeelPage';
import { TempoPage } from './TempoPage';

/**
 * Pantallas de teoría de cada módulo, en orden (máximo 3). Es un `Record`
 * completo: un módulo nuevo no compila hasta tener su teoría.
 */
export const THEORY_PAGES: Record<ModuleId, readonly ComponentType[]> = {
  notes: [NotesWhatPage, NotesOrderPage, NotesOctavePage],
  pulse: [PulseFeelPage, TempoPage, BpmPage],
};
