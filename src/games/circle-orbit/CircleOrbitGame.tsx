import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  circleOf,
  nextInCycle,
  noteToString,
  pc,
  type CycleDirection,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { CircleOfKeys } from '../../components/music/CircleOfKeys';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODE_META: Record<string, { name: string; direction: CycleDirection; timed: boolean }> = {
  cuartas: { name: 'Círculo de cuartas', direction: 'fourths', timed: false },
  quintas: { name: 'Círculo de quintas', direction: 'fifths', timed: false },
  contrarreloj: { name: 'Contrarreloj', direction: 'fourths', timed: true },
};

interface Round {
  current: NoteName;
  answer: NoteName;
  options: NoteName[];
}

function makeRound(current: NoteName, direction: CycleDirection): Round {
  const answer = nextInCycle(current, direction);
  const pool = circleOf(direction).filter(
    (k) => pc(k) !== pc(current) && pc(k) !== pc(answer),
  );
  const distractors = shuffle(pool).slice(0, 3);
  return { current, answer, options: shuffle([answer, ...distractors]) };
}

export function CircleOrbitGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = params.mode ?? 'cuartas';
  const meta = MODE_META[mode] ?? MODE_META.cuartas;
  const total = meta.timed ? 999 : 12;
  const bestScore = useProgress((s) => s.modeStats[modeKey('circle-orbit', mode)]?.bestScore);
  const session = useSession({ gameId: 'circle-orbit', modeId: mode, totalRounds: total });
  const { state, answer, finish, persist, reset } = session;
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (state.phase === 'finished') persist();
  }, [state.phase, persist]);

  const [startKey] = useState<NoteName>(() => pickRandom(circleOf(meta.direction)));
  const [current, setCurrent] = useState<NoteName>(startKey);
  const [round, setRound] = useState<Round>(() => makeRound(startKey, meta.direction));
  const [locked, setLocked] = useState(false);
  const [selectedPc, setSelectedPc] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const stepsDone = state.correct;

  useEffect(() => {
    if (!meta.timed || locked || state.phase === 'finished') return;
    const started = Date.now();
    const iv = window.setInterval(() => {
      const left = 60 - Math.floor((Date.now() - started) / 1000);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(iv);
        finish();
      }
    }, 250);
    return () => window.clearInterval(iv);
  }, [meta.timed, locked, state.phase, finish]);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    const fresh = pickRandom(circleOf(meta.direction));
    setCurrent(fresh);
    setRound(makeRound(fresh, meta.direction));
    setLocked(false);
    setSelectedPc(null);
    setTimeLeft(60);
  }, [meta.direction, reset, clearTimers]);

  const pick = (option: NoteName) => {
    if (locked || state.phase === 'finished') return;
    const isCorrect = pc(option) === pc(round.answer);
    setLocked(true);
    setSelectedPc(pc(option));
    answer(isCorrect);
    const t = window.setTimeout(() => {
      if (isCorrect) setCurrent(round.answer);
      setRound(makeRound(isCorrect ? round.answer : round.current, meta.direction));
      setLocked(false);
      setSelectedPc(null);
    }, 1100);
    timers.current.push(t);
  };

  const tip = meta.timed
    ? 'Vas por el círculo de cuartas: encadena tantas respuestas seguidas como puedas en 60 segundos.'
    : meta.direction === 'fourths'
      ? 'Asciende por cuartas justas: C–F–Bb–Eb–Ab–Db–Gb–B–E–A–D–G.'
      : 'Asciende por quintas justas: C–G–D–A–E–B–F#–Db–Ab–Eb–Bb–F.';

  if (state.phase === 'finished') {
    return (
      <GameShell title={meta.name} state={state} totalRounds={meta.timed ? Math.max(1, state.answered) : total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/circulo-cuartas-quintas')}
          tip={tip}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title={meta.name}
      subtitle={
        meta.timed
          ? `Contrarreloj · ${timeLeft}s · llevas ${stepsDone} aciertos`
          : `Paso ${Math.min(state.round + 1, 12)}/12 desde ${noteToString(startKey)}`
      }
      state={state}
      totalRounds={meta.timed ? Math.max(1, state.round + 1) : total}
      feedback={
        locked
          ? {
              tone: selectedPc === pc(round.answer) ? 'correct' : 'wrong',
              text:
                selectedPc === pc(round.answer)
                  ? `¡Correcto! Después de ${noteToString(round.current)} viene ${noteToString(round.answer)}`
                  : `Después de ${noteToString(round.current)} viene ${noteToString(round.answer)}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col items-center gap-6 p-6">
        <CircleOfKeys
          direction={meta.direction}
          activeKey={current}
          targetKey={locked ? null : round.answer}
          size={280}
        />
        <div className="text-center">
          <p className="text-sm text-ink-muted">¿Qué tonalidad sigue a</p>
          <p className="mt-1 text-3xl font-bold text-primary">{noteToString(round.current)}</p>
        </div>
        <OptionGrid cols={4}>
          {round.options.map((option) => (
            <OptionButton
              key={noteToString(option)}
              disabled={locked}
              state={
                locked
                  ? pc(option) === pc(round.answer)
                    ? 'correct'
                    : selectedPc === pc(option)
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
              onClick={() => pick(option)}
            >
              {noteToString(option)}
            </OptionButton>
          ))}
        </OptionGrid>
        {meta.timed && (
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-app-light">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
