import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  bluesProgressionIn,
  chordFreqs,
  CIRCLE_OF_FOURTHS,
  noteToString,
  pc,
  type BluesBar,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { usePlayChords } from '../../components/music/display';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/primitives';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODE_NAMES: Record<string, string> = {
  compases: '¿Qué acorde suena?',
  siguiente: 'Sigue la forma',
  oido: 'Blues por oído',
};

const MODE_TOTALS: Record<string, number> = { compases: 10, siguiente: 10, oido: 8 };

const MODE_TIPS: Record<string, string> = {
  compases:
    'Forma de 12 compases: I en 1–4, IV en 5–6, vuelta a I en 7–8, V en 9, IV en 10, I en 11 y V de giro en 12.',
  siguiente: 'Memoriza las transiciones: 4→IV, 6→I, 8→V, 9→IV, 11→V. Ese giro final es la clave.',
  oido: 'Escucha hacia dónde resuelve: el V7 del compás 9 te delata la tonalidad.',
};

function randomKey(): NoteName {
  return pickRandom(CIRCLE_OF_FOURTHS);
}

function uniqueSymbols(progression: BluesBar[]): string[] {
  return [...new Set(progression.map((bar) => bar.symbol))];
}

interface BarRound {
  key: NoteName;
  barIndex: number;
  progression: BluesBar[];
  answer: string;
  options: string[];
}

function makeBarRound(): BarRound {
  const key = randomKey();
  const progression = bluesProgressionIn(key);
  const barIndex = Math.floor(Math.random() * 12);
  const answer = progression[barIndex].symbol;
  return { key, barIndex, progression, answer, options: shuffle(uniqueSymbols(progression)) };
}

function makeNextRound(): BarRound {
  const key = randomKey();
  const progression = bluesProgressionIn(key);
  const barIndex = Math.floor(Math.random() * 11);
  const answer = progression[barIndex + 1].symbol;
  return { key, barIndex, progression, answer, options: shuffle(uniqueSymbols(progression)) };
}

interface OidoRound {
  key: NoteName;
  options: NoteName[];
}

function makeOidoRound(): OidoRound {
  const key = randomKey();
  const wrong = shuffle(CIRCLE_OF_FOURTHS.filter((k) => pc(k) !== pc(key))).slice(0, 3);
  return { key, options: shuffle([key, ...wrong]) };
}

function BluesChart({
  progression,
  knownThrough,
  highlightIndex,
  revealAll,
}: {
  progression: BluesBar[];
  knownThrough: number;
  highlightIndex: number;
  revealAll: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {progression.map((bar, i) => {
        const highlighted = i === highlightIndex;
        const show = revealAll || i <= knownThrough;
        return (
          <div
            key={i}
            className={`flex flex-col items-center rounded-lg border px-1 py-1.5 text-center ${
              highlighted
                ? 'border-primary bg-primary-soft'
                : show
                  ? 'border-line bg-app-light'
                  : 'border-line bg-app-dark/40'
            }`}
          >
            <span className="text-[10px] text-ink-muted">{i + 1}</span>
            <span
              className={`text-xs font-semibold ${highlighted ? 'text-primary' : 'text-ink'}`}
            >
              {show ? bar.symbol : highlighted ? '¿?' : '·'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BluesDrillGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = MODE_NAMES[params.mode ?? ''] ? (params.mode as string) : 'compases';
  const total = MODE_TOTALS[mode];
  const bestScore = useProgress((s) => s.modeStats[modeKey('blues-drill', mode)]?.bestScore);
  const session = useSession({ gameId: 'blues-drill', modeId: mode, totalRounds: total });
  const { state, answer, persist, reset } = session;
  const playChords = usePlayChords();
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (state.phase === 'finished') persist();
  }, [state.phase, persist]);

  const [barRound, setBarRound] = useState<BarRound>(() =>
    mode === 'siguiente' ? makeNextRound() : makeBarRound(),
  );
  const [barLocked, setBarLocked] = useState(false);
  const [barSelected, setBarSelected] = useState<string | null>(null);

  const [oidoRound, setOidoRound] = useState(makeOidoRound);
  const [oidoLocked, setOidoLocked] = useState(false);
  const [oidoSelected, setOidoSelected] = useState<number | null>(null);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    setBarRound(mode === 'siguiente' ? makeNextRound() : makeBarRound());
    setBarLocked(false);
    setBarSelected(null);
    setOidoRound(makeOidoRound());
    setOidoLocked(false);
    setOidoSelected(null);
  }, [reset, clearTimers, mode]);

  const playBlues = async () => {
    const chords = bluesProgressionIn(oidoRound.key).map((bar) => chordFreqs(bar.notes, 3));
    await playChords(chords, 0.8, 0.06);
  };

  const answerBar = (option: string) => {
    if (barLocked || state.phase === 'finished') return;
    const ok = option === barRound.answer;
    setBarLocked(true);
    setBarSelected(option);
    answer(ok);
    const t = window.setTimeout(() => {
      setBarRound(mode === 'siguiente' ? makeNextRound() : makeBarRound());
      setBarLocked(false);
      setBarSelected(null);
    }, 1700);
    timers.current.push(t);
  };

  const answerOido = (option: NoteName) => {
    if (oidoLocked || state.phase === 'finished') return;
    const ok = pc(option) === pc(oidoRound.key);
    setOidoLocked(true);
    setOidoSelected(pc(option));
    answer(ok);
    const t = window.setTimeout(() => {
      setOidoRound(makeOidoRound());
      setOidoLocked(false);
      setOidoSelected(null);
    }, 1800);
    timers.current.push(t);
  };

  if (state.phase === 'finished') {
    return (
      <GameShell title={MODE_NAMES[mode]} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/blues')}
          tip={MODE_TIPS[mode]}
        />
      </GameShell>
    );
  }

  if (mode === 'oido') {
    const answerPc = pc(oidoRound.key);
    return (
      <GameShell
        title="Blues por oído"
        subtitle="Suena un blues de 12 compases: ¿en qué tonalidad?"
        state={state}
        totalRounds={total}
        footer={
          <Button variant="secondary" onClick={() => void playBlues()}>
            🔊 Volver a escuchar
          </Button>
        }
        feedback={
          oidoLocked
            ? {
                tone: oidoSelected === answerPc ? 'correct' : 'wrong',
                text:
                  oidoSelected === answerPc
                    ? `¡Sí! Blues en ${noteToString(oidoRound.key)}`
                    : `Estaba en ${noteToString(oidoRound.key)}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col items-center gap-6 p-8">
          <Button size="lg" onClick={() => void playBlues()} disabled={oidoLocked}>
            ▶ Escuchar blues
          </Button>
          <OptionGrid cols={4}>
            {oidoRound.options.map((option) => (
              <OptionButton
                key={noteToString(option)}
                disabled={oidoLocked}
                state={
                  oidoLocked
                    ? pc(option) === answerPc
                      ? 'correct'
                      : oidoSelected === pc(option)
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() => answerOido(option)}
              >
                {noteToString(option)}
              </OptionButton>
            ))}
          </OptionGrid>
        </div>
      </GameShell>
    );
  }

  const isNext = mode === 'siguiente';
  return (
    <GameShell
      title={isNext ? 'Sigue la forma' : '¿Qué acorde suena?'}
      subtitle={
        isNext
          ? `Blues en ${noteToString(barRound.key)} · compás ${barRound.barIndex + 1} → ${barRound.barIndex + 2}`
          : `Blues en ${noteToString(barRound.key)} · compás ${barRound.barIndex + 1}`
      }
      state={state}
      totalRounds={total}
      feedback={
        barLocked
          ? {
              tone: barSelected === barRound.answer ? 'correct' : 'wrong',
              text:
                barSelected === barRound.answer
                  ? `¡Exacto! ${isNext ? `en el compás ${barRound.barIndex + 2} va` : 'en el compás'} ${barRound.answer}`
                  : `${isNext ? `En el compás ${barRound.barIndex + 2} va` : 'Iba'} ${barRound.answer}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="primary">Blues en {noteToString(barRound.key)}</Chip>
          {isNext && <Chip>{barRound.progression[barRound.barIndex].symbol} → ?</Chip>}
        </div>
        <BluesChart
          progression={barRound.progression}
          knownThrough={isNext ? barRound.barIndex : barRound.barIndex - 1}
          highlightIndex={isNext ? barRound.barIndex + 1 : barRound.barIndex}
          revealAll={barLocked}
        />
        <OptionGrid cols={3}>
          {barRound.options.map((option) => (
            <OptionButton
              key={option}
              disabled={barLocked}
              state={
                barLocked
                  ? option === barRound.answer
                    ? 'correct'
                    : barSelected === option
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
              onClick={() => answerBar(option)}
            >
              {option}
            </OptionButton>
          ))}
        </OptionGrid>
      </div>
    </GameShell>
  );
}
