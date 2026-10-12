import { useCallback, useState } from 'react';
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
    round: 0,
    phase: 'playing',
  };
}

export function useSession(config: SessionConfig) {
  const record = useProgress((s) => s.record);
  const [state, setState] = useState<SessionState>(() => makeInitial(config.lives ?? 3));

  const reset = useCallback(() => setState(makeInitial(config.lives ?? 3)), [config.lives]);

  const answer = useCallback(
    (isCorrect: boolean, points = 100) => {
      setState((prev) => {
        if (prev.phase === 'finished') return prev;
        const answered = prev.answered + 1;
        const correct = prev.correct + (isCorrect ? 1 : 0);
        const streak = isCorrect ? prev.streak + 1 : 0;
        const bonus = isCorrect ? points + Math.min(streak * 10, 50) : 0;
        const score = prev.score + bonus;
        const lives = isCorrect ? prev.lives : Math.max(0, prev.lives - 1);
        const round = prev.round + 1;
        const outOfLives = lives === 0;
        const done = outOfLives || round >= config.totalRounds;
        return {
          ...prev,
          answered,
          correct,
          streak,
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
      setState((prev) => {
        if (prev.answered > 0) {
          record({
            gameId: config.gameId,
            modeId: config.modeId,
            score: prev.score,
            correct: prev.correct,
            total: prev.answered,
            keyTag: config.keyTag,
            ...extra,
          });
        }
        return prev;
      });
    },
    [config.gameId, config.modeId, config.keyTag, record],
  );

  return { state, answer, finish, persist, reset };
}
