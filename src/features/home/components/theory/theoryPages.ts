import { ComponentType } from 'react';

import { ModuleId } from '@/domain/lessons';

import { FiguresListPage } from './FiguresListPage';
import { FiguresPlayPage } from './FiguresPlayPage';
import { FiguresWhatPage } from './FiguresWhatPage';
import { NotesOctavePage } from './NotesOctavePage';
import { NotesOrderPage } from './NotesOrderPage';
import { NotesWhatPage } from './NotesWhatPage';
import { PulseWhatPage } from './PulseWhatPage';
import { TempoWhatPage } from './TempoWhatPage';

/**
 * Pantallas de teoría de cada módulo, en orden (máximo 3). Es un `Record`
 * completo: un módulo nuevo no compila hasta tener su teoría.
 */
export const THEORY_PAGES: Record<ModuleId, readonly ComponentType[]> = {
  notes: [NotesWhatPage, NotesOrderPage, NotesOctavePage],
  pulse: [PulseWhatPage, TempoWhatPage],
  figures: [FiguresWhatPage, FiguresListPage, FiguresPlayPage],
};
