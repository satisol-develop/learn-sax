import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  chordFreqs,
  chordSymbol,
  CIRCLE_OF_FOURTHS,
  cycleFrom,
  iiViIn,
  noteToString,
  pc,
  type CycleDirection,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { Button } from '../../components/ui/Button';import { Chip } from '../../components/ui/primitives';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';
import { ensureAudio, playNotes } from '../../audio/engine';

const MODES: Record<string, string> = {
  cadena: 'La cadena',
  raices: 'Raíces del ciclo',
  oido: 'ii-V-I por oído',
};

const TOTALS: Record<string, number> = { cadena: 8, raices: 8, oido: 10 };

const TIPS: Record<string, string> = {
  cadena: 'Cada I resuelta abre la puerta del siguiente ii-V-I una cuarta más abajo.',
  raices: 'Las raíces del ii-V-I son grado 2–5–1 de la tonalidad. Encadena: 2–5–1, 2–5–1…',
  oido: 'Escucha hacia dónde resuelve el V7: la 3ª del V guía hacia la tónica del I.',
};

const DIRECTION: CycleDirection = 'fourths';

function fmtProgression(key: NoteName): string {
  return iiViIn(key).symbols.join(' · ');
}

function rootsTriple(key: NoteName): string {
  const p = iiViIn(key);
  return `${noteToString(p.ii)} · ${noteToString(p.V)} · ${noteToString(p.I)}`;
}

function otherRoots(key: NoteName): string {
  const p = iiViIn(key);
  const shift = pickRandom([1, 2, 5, 7]);
  const wrong: NoteName[] = [p.ii, p.V, p.I].map(
    (note) => CIRCLE_OF_FOURTHS[(CIRCLE_OF_FOURTHS.findIndex((k) => pc(k) === pc(note)) + shift) % 12],
  );
  return wrong.map((n2) => noteToString(n2)).join(' · ');
}

interface ChainRound {
  currentKey: NoteName;
  nextKey: NoteName;
  options: string[];
}

function makeChainRound(currentKey: NoteName): ChainRound {
  const nextKey = cycleFrom(currentKey, DIRECTION)[1];
  const answer = fmtProgression(nextKey);
  const near = [cycleFrom(nextKey, DIRECTION)[1], cycleFrom(nextKey, DIRECTION)[11]];
  const distractors = near.map(fmtProgression);
  const extra = fmtProgression(pickRandom(CIRCLE_OF_FOURTHS.filter((k) => pc(k) !== pc(nextKey))));
  return {
    currentKey,
    nextKey,
    options: shuffle([answer, ...distractors, extra].slice(0, 4)),
  };
}

interface RootsRound {
  currentKey: NoteName;
  nextKey: NoteName;
  options: string[];
}

function makeRootsRound(currentKey: NoteName): RootsRound {
  const nextKey = cycleFrom(currentKey, DIRECTION)[1];
  const answer = rootsTriple(nextKey);
  const distractors = [
    rootsTriple(cycleFrom(nextKey, DIRECTION)[1]),
    rootsTriple(cycleFrom(nextKey, DIRECTION)[11]),
    otherRoots(nextKey),
  ];
  return { currentKey, nextKey, options: shuffle([answer, ...distractors]) };
}

interface OidoRound {
  key: NoteName;
  options: NoteName[];
}

function makeOidoRound(): OidoRound {
  const key = pickRandom(CIRCLE_OF_FOURTHS);
  const wrong = shuffle(CIRCLE_OF_FOURTHS.filter((k) => pc(k) !== pc(key))).slice(0, 3);
  return { key, options: shuffle([key, ...wrong]) };
}

export function IiviChainGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = params.mode ?? 'cadena';
  const total = TOTALS[mode] ?? 8;
  const bestScore = useProgress((s) => s.modeStats[modeKey('iivi-chain', mode)]?.bestScore);
  const session = useSession({ gameId: 'iivi-chain', modeId: mode, totalRounds: total });
  const { state, answer, persist, reset } = session;
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (state.phase === 'finished') persist();
  }, [state.phase, persist]);

  const [chainStart] = useState(() => pickRandom(CIRCLE_OF_FOURTHS));
  const [chainRound, setChainRound] = useState<ChainRound>(() => makeChainRound(chainStart));
  const [chainLocked, setChainLocked] = useState(false);
  const [chainSelected, setChainSelected] = useState<string | null>(null);

  const [rootsStart] = useState(() => pickRandom(CIRCLE_OF_FOURTHS));
  const [rootsRound, setRootsRound] = useState<RootsRound>(() => makeRootsRound(rootsStart));
  const [rootsLocked, setRootsLocked] = useState(false);
  const [rootsSelected, setRootsSelected] = useState<string | null>(null);

  const [oidoRound, setOidoRound] = useState(makeOidoRound);
  const [oidoLocked, setOidoLocked] = useState(false);
  const [oidoSelected, setOidoSelected] = useState<number | null>(null);

  const playIivi = async (key: NoteName) => {
    await ensureAudio();
    const p = iiViIn(key);
    const seq: number[] = [];
    p.notes.forEach((chord) => {
      chordFreqs(chord, 3).forEach((f) => seq.push(f));
    });
    await playNotes(seq, 0.85, 0.25);
  };

  const playOido = async (key: NoteName) => {
    await ensureAudio();
    const p = iiViIn(key);
    const all: number[] = [];
    p.notes.forEach((chord) => all.push(...chordFreqs(chord, 3)));
    await playNotes(all, 0.85, 0.3);
  };

  const restart = useCallback(() => {
    clearTimers();
    reset();
    const fresh1 = pickRandom(CIRCLE_OF_FOURTHS);
    setChainRound(makeChainRound(fresh1));
    setChainLocked(false);
    setChainSelected(null);
    const fresh2 = pickRandom(CIRCLE_OF_FOURTHS);
    setRootsRound(makeRootsRound(fresh2));
    setRootsLocked(false);
    setRootsSelected(null);
    setOidoRound(makeOidoRound());
    setOidoLocked(false);
    setOidoSelected(null);
  }, [reset, clearTimers]);

  const answerChain = (option: string) => {
    if (chainLocked || state.phase === 'finished') return;
    const ok = option === fmtProgression(chainRound.nextKey);
    setChainLocked(true);
    setChainSelected(option);
    answer(ok);
    const t = window.setTimeout(() => {
      setChainRound(makeChainRound(ok ? chainRound.nextKey : chainRound.currentKey));
      setChainLocked(false);
      setChainSelected(null);
    }, 1700);
    timers.current.push(t);
  };

  const answerRoots = (option: string) => {
    if (rootsLocked || state.phase === 'finished') return;
    const ok = option === rootsTriple(rootsRound.nextKey);
    setRootsLocked(true);
    setRootsSelected(option);
    answer(ok);
    const t = window.setTimeout(() => {
      setRootsRound(makeRootsRound(ok ? rootsRound.nextKey : rootsRound.currentKey));
      setRootsLocked(false);
      setRootsSelected(null);
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
      <GameShell title={MODES[mode] ?? 'La Cadena'} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/ii-v-i-circulo')}
          tip={TIPS[mode]}
        />
      </GameShell>
    );
  }

  if (mode === 'cadena') {
    const current = iiViIn(chainRound.currentKey);
    const answerStr = fmtProgression(chainRound.nextKey);
    return (
      <GameShell
        title="La cadena"
        subtitle="ii-V-I por el ciclo de cuartas"
        state={state}
        totalRounds={total}
        footer={
          <Button variant="secondary" onClick={() => void playIivi(chainRound.currentKey)}>
            🔊 Escuchar el ii-V-I actual
          </Button>
        }
        feedback={
          chainLocked
            ? {
                tone: chainSelected === answerStr ? 'correct' : 'wrong',
                text:
                  chainSelected === answerStr
                    ? `¡Bien! Sigue ${answerStr}`
                    : `El siguiente era ${answerStr}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-app-dark/40 p-5">
            <div className="flex gap-2">
              <Chip tone="primary">ii</Chip>
              <Chip tone="primary">V</Chip>
              <Chip tone="primary">I</Chip>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-2 text-xl font-bold sm:text-2xl">
              {current.symbols.map((sym, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {i > 0 && <span className="text-ink-muted">→</span>}
                  {sym}
                </span>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              resuelve en {noteToString(chainRound.currentKey)} · ¿y el siguiente?
            </p>
          </div>
          <OptionGrid cols={2}>
            {chainRound.options.map((option) => (
              <OptionButton
                key={option}
                disabled={chainLocked}
                state={
                  chainLocked
                    ? option === answerStr
                      ? 'correct'
                      : chainSelected === option
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() => answerChain(option)}
                className="text-sm"
              >
                {option}
              </OptionButton>
            ))}
          </OptionGrid>
        </div>
      </GameShell>
    );
  }

  if (mode === 'raices') {
    const answerStr = rootsTriple(rootsRound.nextKey);
    return (
      <GameShell
        title="Raíces del ciclo"
        subtitle={`Resuelta en ${noteToString(rootsRound.currentKey)} · ¿cuáles son las raíces del próximo ii-V-I?`}
        state={state}
        totalRounds={total}
        feedback={
          rootsLocked
            ? {
                tone: rootsSelected === answerStr ? 'correct' : 'wrong',
                text:
                  rootsSelected === answerStr
                    ? `¡Exacto! ${answerStr}`
                    : `Las raíces eran ${answerStr}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-app-dark/40 p-5">
            <p className="text-sm text-ink-muted">El I que acaba de sonar</p>
            <p className="text-2xl font-bold">{chordSymbol(rootsRound.currentKey, 'maj7')}</p>
            <p className="text-sm text-ink-muted">Próximo ii–V–I en cuartas →</p>
          </div>
          <OptionGrid cols={2}>
            {rootsRound.options.map((option) => (
              <OptionButton
                key={option}
                disabled={rootsLocked}
                state={
                  rootsLocked
                    ? option === answerStr
                      ? 'correct'
                      : rootsSelected === option
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() => answerRoots(option)}
                className="text-sm"
              >
                {option}
              </OptionButton>
            ))}
          </OptionGrid>
        </div>
      </GameShell>
    );
  }

  const answerKeyPc = pc(oidoRound.key);
  return (
    <GameShell
      title="ii-V-I por oído"
      subtitle="Suena un ii-V-I completo: ¿en qué tonalidad resuelve?"
      state={state}
      totalRounds={total}
      footer={
        <Button variant="secondary" onClick={() => void playOido(oidoRound.key)}>
          🔊 Volver a escuchar
        </Button>
      }
      feedback={
        oidoLocked
          ? {
              tone: oidoSelected === answerKeyPc ? 'correct' : 'wrong',
              text:
                oidoSelected === answerKeyPc
                  ? `¡Sí! Resuelve en ${noteToString(oidoRound.key)}`
                  : `Resolvía en ${noteToString(oidoRound.key)}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col items-center gap-6 p-8">
        <Button size="lg" onClick={() => void playOido(oidoRound.key)} disabled={oidoLocked}>
          ▶ Escuchar ii-V-I
        </Button>
        <OptionGrid cols={4}>
          {oidoRound.options.map((option) => (
            <OptionButton
              key={noteToString(option)}
              disabled={oidoLocked}
              state={
                oidoLocked
                  ? pc(option) === answerKeyPc
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
