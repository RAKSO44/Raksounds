import { ComponentType } from 'react';

import { ModuleId } from '@/domain/lessons';

import { DotPage } from './DotPage';
import { FiguresListPage } from './FiguresListPage';
import { FiguresPlayPage } from './FiguresPlayPage';
import { FiguresPulsePage } from './FiguresPulsePage';
import { FiguresWhatPage } from './FiguresWhatPage';
import { NotesOctavePage } from './NotesOctavePage';
import { NotesOrderPage } from './NotesOrderPage';
import { NotesWhatPage } from './NotesWhatPage';
import { PulseWhatPage } from './PulseWhatPage';
import { RestsListPage } from './RestsListPage';
import { RestsPlayPage } from './RestsPlayPage';
import { RestsWhatPage } from './RestsWhatPage';
import { TempoWhatPage } from './TempoWhatPage';
import { TiePage } from './TiePage';

/**
 * Pantallas de teoría de cada módulo, en orden. Es un `Record`
 * completo: un módulo nuevo no compila hasta tener su teoría.
 */
export const THEORY_PAGES: Record<ModuleId, readonly ComponentType[]> = {
  notes: [NotesWhatPage, NotesOrderPage, NotesOctavePage],
  pulse: [PulseWhatPage, TempoWhatPage],
  figures: [FiguresWhatPage, FiguresListPage, FiguresPulsePage, FiguresPlayPage],
  rests: [RestsWhatPage, RestsListPage, DotPage, TiePage, RestsPlayPage],
};
