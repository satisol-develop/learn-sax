import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Instrument } from '../music/core';

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

interface ProgressState {
  settings: Settings;
  modeStats: Record<string, Stat>;
  keyStats: Record<string, Stat>;
  record: (result: GameResult) => void;
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

export function modeKey(gameId: string, modeId: string): string {
  return `${gameId}:${modeId}`;
}

export function keyStatId(gameId: string, modeId: string, tonic: string): string {
  return `${gameId}:${modeId}:${tonic}`;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      settings: { instrument: 'alto', pitchMode: 'concert', theme: 'dark' },
      modeStats: {},
      keyStats: {},
      record: (result) =>
        set((state) => {
          const mk = modeKey(result.gameId, result.modeId);
          const modeStats = {
            ...state.modeStats,
            [mk]: accumulate(state.modeStats[mk], result.correct, result.total, result.score),
          };
          if (!result.keyTag) return { modeStats };
          const kk = keyStatId(result.gameId, result.modeId, result.keyTag);
          return {
            modeStats,
            keyStats: {
              ...state.keyStats,
              [kk]: accumulate(state.keyStats[kk], result.correct, result.total, result.score),
            },
          };
        }),
      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetProgress: () => set({ modeStats: {}, keyStats: {} }),
    }),
    { name: 'learn-sax-v1' },
  ),
);

export function accuracyOf(stat: Stat | undefined): number | null {
  if (!stat || stat.answered === 0) return null;
  return Math.round((stat.correct / stat.answered) * 100);
}
