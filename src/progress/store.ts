import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Instrument } from '../music/core';
import { advanceStreak, dayDiff, dayKey, pushDay } from './habits';

export type PitchMode = 'concert' | 'transposed';
export type ThemeMode = 'dark' | 'light';

export interface Stat {
  plays: number;
  correct: number;
  answered: number;
  bestScore: number;
  lastPlayed: number;
}

export interface GameResult {
  gameId: string;
  modeId: string;
  score: number;
  correct: number;
  total: number;
  keyTag?: string;
}

export interface Settings {
  instrument: Instrument;
  pitchMode: PitchMode;
  theme: ThemeMode;
}

interface HabitFields {
  lastPractice: number | null;
  dailyStreak: number;
  practiceDays: string[];
}

interface RoutineFields {
  routineDay: string | null;
  routineSteps: string[];
}

interface ProgressState extends HabitFields, RoutineFields {
  settings: Settings;
  modeStats: Record<string, Stat>;
  keyStats: Record<string, Stat>;
  record: (result: GameResult) => void;
  touchPractice: () => void;
  markRoutineStep: (stepId: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

const emptyStat = (): Stat => ({
  plays: 0,
  correct: 0,
  answered: 0,
  bestScore: 0,
  lastPlayed: 0,
});

function accumulate(stat: Stat | undefined, correct: number, total: number, score: number): Stat {
  const base = stat ?? emptyStat();
  return {
    plays: base.plays + 1,
    correct: base.correct + correct,
    answered: base.answered + total,
    bestScore: Math.max(base.bestScore, score),
    lastPlayed: Date.now(),
  };
}

function touchHabits(state: HabitFields, now: number): HabitFields {
  if (state.lastPractice !== null && dayDiff(state.lastPractice, now) <= 0) {
    return {
      lastPractice: state.lastPractice,
      dailyStreak: state.dailyStreak,
      practiceDays: state.practiceDays,
    };
  }
  return {
    lastPractice: now,
    dailyStreak: advanceStreak(state.dailyStreak, state.lastPractice, now),
    practiceDays: pushDay(state.practiceDays, dayKey(now)),
  };
}

export function modeKey(gameId: string, modeId: string): string {
  return `${gameId}:${modeId}`;
}

export function keyStatId(gameId: string, modeId: string, tonic: string): string {
  return `${gameId}:${modeId}:${tonic}`;
}

/** Marca un paso de la rutina del día, reiniciando el progreso al cambiar el día. */
function routinePatch(state: RoutineFields, stepId: string, now: number): Partial<RoutineFields> {
  const today = dayKey(now);
  if (state.routineDay !== today) return { routineDay: today, routineSteps: [stepId] };
  if (state.routineSteps.includes(stepId)) return {};
  return { routineSteps: [...state.routineSteps, stepId] };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      settings: { instrument: 'alto', pitchMode: 'concert', theme: 'dark' },
      modeStats: {},
      keyStats: {},
      lastPractice: null,
      dailyStreak: 0,
      practiceDays: [],
      routineDay: null,
      routineSteps: [],
      record: (result) =>
        set((state) => {
          const now = Date.now();
          const habits = touchHabits(state, now);
          const routine = routinePatch(state, `game:${result.gameId}:${result.modeId}`, now);
          const mk = modeKey(result.gameId, result.modeId);
          const modeStats = {
            ...state.modeStats,
            [mk]: accumulate(state.modeStats[mk], result.correct, result.total, result.score),
          };
          if (!result.keyTag) return { ...habits, ...routine, modeStats };
          const kk = keyStatId(result.gameId, result.modeId, result.keyTag);
          return {
            ...habits,
            ...routine,
            modeStats,
            keyStats: {
              ...state.keyStats,
              [kk]: accumulate(state.keyStats[kk], result.correct, result.total, result.score),
            },
          };
        }),
      touchPractice: () => set((state) => touchHabits(state, Date.now())),
      markRoutineStep: (stepId) => set((state) => routinePatch(state, stepId, Date.now())),
      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetProgress: () =>
        set({
          modeStats: {},
          keyStats: {},
          lastPractice: null,
          dailyStreak: 0,
          practiceDays: [],
          routineDay: null,
          routineSteps: [],
        }),
    }),
    { name: 'learn-sax-v1' },
  ),
);

export function accuracyOf(stat: Stat | undefined): number | null {
  if (!stat || stat.answered === 0) return null;
  return Math.round((stat.correct / stat.answered) * 100);
}
