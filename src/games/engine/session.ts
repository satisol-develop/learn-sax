import { useCallback, useRef, useState } from 'react';
import { useProgress, type GameResult } from '../../progress/store';

export interface GameModeMeta {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
}

export interface GameMeta {
  id: string;
  resourceId: string;
  name: string;
  modes: GameModeMeta[];
}

export interface SessionConfig {
  gameId: string;
  modeId: string;
  totalRounds: number;
  lives?: number;
  keyTag?: string;
}

export interface SessionState {
  score: number;
  correct: number;
  answered: number;
  lives: number;
  streak: number;
  bestStreak: number;
  round: number;
  phase: 'playing' | 'finished';
}

function makeInitial(lives: number): SessionState {
  return {
    score: 0,
    correct: 0,
    answered: 0,
    lives,
    streak: 0,
    bestStreak: 0,
    round: 0,
    phase: 'playing',
  };
}

export function useSession(config: SessionConfig) {
  const record = useProgress((s) => s.record);
  const [state, setState] = useState<SessionState>(() => makeInitial(config.lives ?? 3));
  const persistedRef = useRef(false);

  const reset = useCallback(() => {
    persistedRef.current = false;
    setState(makeInitial(config.lives ?? 3));
  }, [config.lives]);

  const answer = useCallback(
    (isCorrect: boolean, points = 100) => {
      setState((prev) => {
        if (prev.phase === 'finished') return prev;
        const answered = prev.answered + 1;
        const correct = prev.correct + (isCorrect ? 1 : 0);
        const streak = isCorrect ? prev.streak + 1 : 0;
        const bestStreak = Math.max(prev.bestStreak, streak);
        const bonus = isCorrect ? points + Math.min(streak * 10, 50) : 0;
        const score = prev.score + bonus;
        const lives = isCorrect ? prev.lives : Math.max(0, prev.lives - 1);
        const round = prev.round + 1;
        const done = lives === 0 || round >= config.totalRounds;
        return {
          ...prev,
          answered,
          correct,
          streak,
          bestStreak,
          score,
          lives,
          round,
          phase: done ? 'finished' : 'playing',
        };
      });
    },
    [config.totalRounds],
  );

  const finish = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'finished' }));
  }, []);

  const persist = useCallback(
    (extra?: Partial<GameResult>) => {
      if (persistedRef.current || state.answered === 0) return;
      persistedRef.current = true;
      record({
        gameId: config.gameId,
        modeId: config.modeId,
        score: state.score,
        correct: state.correct,
        total: state.answered,
        keyTag: config.keyTag,
        ...extra,
      });
    },
    [
      state.answered,
      state.correct,
      state.score,
      config.gameId,
      config.modeId,
      config.keyTag,
      record,
    ],
  );

  return { state, answer, finish, persist, reset };
}
