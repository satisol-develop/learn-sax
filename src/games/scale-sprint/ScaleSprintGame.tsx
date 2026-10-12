import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CIRCLE_OF_FOURTHS,
  cycleFrom,
  majorScale,
  noteFreq,
  noteToString,
  pc,
  scaleFreqs,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { usePlayNotes } from '../../components/music/display';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODE_NAMES: Record<string, string> = {
  ordena: 'Ordena la escala',
  siguiente: '¿Qué nota sigue?',
  rapidez: 'Racha por el círculo',
};

const MODE_TOTALS: Record<string, number> = { ordena: 6, siguiente: 10, rapidez: 12 };

const MODE_TIPS: Record<string, string> = {
  ordena: 'Repasa la fórmula T–T–S–T–T–T–S y la ortografía: una letra por grado.',
  siguiente: 'Cada grado de la escala es un paso del patrón de dedos: practícalo lento en el sax.',
  rapidez: 'El ejercicio de clase: escala siguiente en el círculo de cuartas, sin parar.',
};

function randomKey(): NoteName {
  return pickRandom(CIRCLE_OF_FOURTHS);
}

interface OrderRound {
  key: NoteName;
  scale: NoteName[];
  pool: NoteName[];
  picked: NoteName[];
}

function makeOrderRound(): OrderRound {
  const key = randomKey();
  const scale = majorScale(key);
  return { key, scale, pool: shuffle(scale), picked: [] };
}

function makeNextRound(): { key: NoteName; prefix: NoteName[]; answer: NoteName; options: NoteName[] } {
  const key = randomKey();
  const scale = majorScale(key);
  return makeNextFromScale(key, scale);
}

function makeNextFromScale(
  key: NoteName,
  scale: NoteName[],
  maxDegree = 6,
): { key: NoteName; prefix: NoteName[]; answer: NoteName; options: NoteName[] } {
  const degree = 1 + Math.floor(Math.random() * Math.min(5, maxDegree - 1) + (maxDegree === 6 ? 1 : 0));
  const d = Math.min(degree, scale.length - 1);
  const answer = scale[d];
  const others = scale.filter((_, i) => i !== d && i !== d + 1 && i !== d - 1);
  const distractors = shuffle(others).slice(0, 3);
  return { key, prefix: scale.slice(0, d), answer, options: shuffle([answer, ...distractors]) };
}

export function ScaleSprintGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = params.mode ?? 'ordena';
  const total = MODE_TOTALS[mode] ?? 6;
  const bestScore = useProgress((s) => s.modeStats[modeKey('scale-sprint', mode)]?.bestScore);
  const session = useSession({ gameId: 'scale-sprint', modeId: mode, totalRounds: total });
  const { state, answer, persist, reset } = session;
  const playNotes = usePlayNotes();
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (state.phase === 'finished') persist();
  }, [state.phase, persist]);

  const [orderRound, setOrderRound] = useState<OrderRound>(makeOrderRound);
  const [orderLocked, setOrderLocked] = useState(false);
  const [orderReveal, setOrderReveal] = useState<string | null>(null);

  const [nextRound, setNextRound] = useState(makeNextRound);
  const [locked, setLocked] = useState(false);
  const [selectedPc, setSelectedPc] = useState<number | null>(null);

  const [chainStart] = useState(() => randomKey());
  const chain = useMemo(() => cycleFrom(chainStart, 'fourths'), [chainStart]);
  const [chainIdx, setChainIdx] = useState(0);
  const [chainRound, setChainRound] = useState(() =>
    makeNextFromScale(chainStart, majorScale(chainStart), 5),
  );
  const [timeLeft, setTimeLeft] = useState(5);

  const nextChainRound = useCallback(
    (fromIdx: number) => {
      const nextIdx = fromIdx + 1;
      if (nextIdx >= chain.length) return;
      const key = chain[nextIdx];
      setChainIdx(nextIdx);
      setChainRound(makeNextFromScale(key, majorScale(key), 5));
      setLocked(false);
      setSelectedPc(null);
      setTimeLeft(5);
    },
    [chain],
  );

  useEffect(() => {
    if (mode !== 'rapidez' || locked || state.phase === 'finished') return;
    const started = Date.now();
    const iv = window.setInterval(() => {
      const left = 5 - Math.floor((Date.now() - started) / 1000);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(iv);
        setLocked(true);
        setSelectedPc(-1);
        answer(false);
        const t = window.setTimeout(() => nextChainRound(chainIdx), 1300);
        timers.current.push(t);
      }
    }, 200);
    return () => window.clearInterval(iv);
  }, [mode, locked, state.phase, chainIdx, answer, nextChainRound]);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    setOrderReveal(null);
    setOrderLocked(false);
    setOrderRound(makeOrderRound());
    setNextRound(makeNextRound());
    setLocked(false);
    setSelectedPc(null);
    setChainIdx(0);
    setChainRound(makeNextFromScale(chainStart, majorScale(chainStart), 5));
    setTimeLeft(5);
  }, [chainStart, reset, clearTimers]);

  const pickOrder = (note: NoteName) => {
    if (orderLocked) return;
    void playNotes([noteFreq(note, 4)], 0.3, 0);
    const picked = [...orderRound.picked, note];
    const poolIdx = orderRound.pool.findIndex((n2) => pc(n2) === pc(note));
    const pool = poolIdx >= 0 ? orderRound.pool.filter((_, i) => i !== poolIdx) : orderRound.pool;
    if (picked.length === 7) {
      setOrderRound({ ...orderRound, picked, pool });
      setOrderLocked(true);
      const ok = picked.every((n2, i) => pc(n2) === pc(orderRound.scale[i]));
      setOrderReveal(ok ? 'ok' : orderRound.scale.map((n2) => noteToString(n2)).join(' '));
      if (ok) void playNotes(scaleFreqs(orderRound.scale, 4), 0.28, 0.05);
      answer(ok);
      const t = window.setTimeout(() => {
        setOrderRound(makeOrderRound());
        setOrderLocked(false);
        setOrderReveal(null);
      }, 1600);
      timers.current.push(t);
      return;
    }
    setOrderRound({ ...orderRound, picked, pool });
  };

  const answerNext = (option: NoteName, correctAnswer: NoteName, advance: () => void) => {
    if (locked || state.phase === 'finished') return;
    const isCorrect = pc(option) === pc(correctAnswer);
    setLocked(true);
    setSelectedPc(pc(option));
    if (isCorrect) void playNotes([noteFreq(correctAnswer, 4)], 0.35, 0);
    answer(isCorrect);
    const t = window.setTimeout(advance, 1200);
    timers.current.push(t);
  };

  if (state.phase === 'finished') {
    return (
      <GameShell title={MODE_NAMES[mode] ?? 'Escala Relámpago'} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/escalas-mayores')}
          tip={MODE_TIPS[mode]}
        />
      </GameShell>
    );
  }

  if (mode === 'ordena') {
    return (
      <GameShell
        title="Ordena la escala"
        subtitle={`Escala mayor de ${noteToString(orderRound.key)}`}
        state={state}
        totalRounds={total}
        feedback={
          orderReveal !== null
            ? {
                tone: orderReveal === 'ok' ? 'correct' : 'wrong',
                text:
                  orderReveal === 'ok'
                    ? `¡Exacto! ${orderRound.scale.map((n2) => noteToString(n2)).join(' ')}`
                    : `La escala correcta es: ${orderReveal}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-5 p-6">
          <p className="text-sm text-ink-muted">
            Toca las notas en orden ascendente para construir la escala mayor.
          </p>
          <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border border-line bg-app-dark/40 p-3">
            {orderRound.picked.length === 0 && (
              <span className="text-sm text-ink-muted">Empieza por la tónica…</span>
            )}
            {orderRound.picked.map((note, i) => (
              <span
                key={i}
                className="animate-pop rounded-xl bg-primary-soft px-3 py-1.5 font-semibold text-primary"
              >
                {noteToString(note)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {orderRound.pool.map((note, i) => (
              <button
                key={i}
                type="button"
                disabled={orderLocked}
                onClick={() => pickOrder(note)}
                className="lift hover:-translate-y-0.5 hover:border-sheen focus-ring rounded-2xl border border-line bg-app-light px-4 py-2.5 text-base font-semibold disabled:opacity-40"
              >
                {noteToString(note)}
              </button>
            ))}
          </div>
        </div>
      </GameShell>
    );
  }

  if (mode === 'siguiente') {
    return (
      <GameShell
        title="¿Qué nota sigue?"
        subtitle={`Escala mayor de ${noteToString(nextRound.key)}`}
        state={state}
        totalRounds={total}
        feedback={
          locked
            ? {
                tone: selectedPc === pc(nextRound.answer) ? 'correct' : 'wrong',
                text:
                  selectedPc === pc(nextRound.answer)
                    ? `¡Sí! Sigue ${noteToString(nextRound.answer)}`
                    : `Seguía ${noteToString(nextRound.answer)}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            {nextRound.prefix.map((note, i) => (
              <span
                key={i}
                className="rounded-xl border border-line bg-app-light px-3 py-1.5 font-semibold"
              >
                {noteToString(note)}
              </span>
            ))}
            <span className="rounded-xl border border-dashed border-primary/50 px-3 py-1.5 font-semibold text-primary">
              ?
            </span>
          </div>
          <OptionGrid>
            {nextRound.options.map((option) => (
              <OptionButton
                key={noteToString(option)}
                disabled={locked}
                state={
                  locked
                    ? pc(option) === pc(nextRound.answer)
                      ? 'correct'
                      : selectedPc === pc(option)
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() =>
                  answerNext(option, nextRound.answer, () => {
                    setNextRound(makeNextRound());
                    setLocked(false);
                    setSelectedPc(null);
                  })
                }
              >
                {noteToString(option)}
              </OptionButton>
            ))}
          </OptionGrid>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Racha por el círculo"
      subtitle={`${chainIdx + 1}/12 · clave de ${noteToString(chainRound.key)}`}
      state={state}
      totalRounds={total}
      feedback={
        locked
          ? {
              tone: selectedPc === pc(chainRound.answer) ? 'correct' : 'wrong',
              text:
                selectedPc === pc(chainRound.answer)
                  ? `¡Bien! Sigue ${noteToString(chainRound.answer)}`
                  : `Seguía ${noteToString(chainRound.answer)}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {chainRound.prefix.map((note, i) => (
              <span
                key={i}
                className="rounded-xl border border-line bg-app-light px-3 py-1.5 font-semibold"
              >
                {noteToString(note)}
              </span>
            ))}
            <span className="rounded-xl border border-dashed border-primary/50 px-3 py-1.5 font-semibold text-primary">
              ?
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              timeLeft <= 2 ? 'bg-danger/15 text-danger' : 'bg-app-light text-ink-muted'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
        <OptionGrid>
          {chainRound.options.map((option) => (
            <OptionButton
              key={noteToString(option)}
              disabled={locked}
              state={
                locked
                  ? pc(option) === pc(chainRound.answer)
                    ? 'correct'
                    : selectedPc === pc(option)
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
              onClick={() =>
                answerNext(option, chainRound.answer, () => nextChainRound(chainIdx))
              }
            >
              {noteToString(option)}
            </OptionButton>
          ))}
        </OptionGrid>
      </div>
    </GameShell>
  );
}
