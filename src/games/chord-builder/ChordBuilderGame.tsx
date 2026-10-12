import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  buildChord,
  chordSymbol,
  CHORD_LABELS,
  CHORD_SUFFIX,
  CIRCLE_OF_FOURTHS,
  majorScale,
  noteFreq,
  noteToString,
  pc,
  type ChordQuality,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { usePlayChord } from '../../components/music/display';
import { Button } from '../../components/ui/Button';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODES: Record<string, string> = {
  construye: 'Construye el acorde',
  calidad: 'Calidad por oído',
  simbolo: 'Nombra el acorde',
};

const TOTALS: Record<string, number> = { construye: 8, calidad: 10, simbolo: 10 };

const TIPS: Record<string, string> = {
  construye: 'Terceras apiladas: una letra por nota. maj7 = 1 3 5 7, m7 = 1 ♭3 5 ♭7, 7 = 1 3 5 ♭7.',
  calidad: 'Escucha la 3ª y la 7ª: la 3ª decide mayor/menor, la 7ª si es dominante.',
  simbolo: 'Mira la tónica y apila terceras hasta conseguir 4 notas: eso es la cuatriada.',
};

const QUALITIES: ChordQuality[] = ['maj7', 'm7', '7', 'm7b5', 'dim7'];

function randomRoot(): NoteName {
  return pickRandom(CIRCLE_OF_FOURTHS);
}

function randomQuality(): ChordQuality {
  return pickRandom(QUALITIES);
}

interface BuildRound {
  root: NoteName;
  quality: ChordQuality;
  chord: NoteName[];
  pool: NoteName[];
}

function makeBuildRound(): BuildRound {
  const root = randomRoot();
  const quality = randomQuality();
  const chord = buildChord(root, quality);
  const scale = majorScale(root);
  const extras = scale.filter((note) => !chord.some((c) => pc(c) === pc(note)));
  const chromatic = [
    { letter: root.letter, accidental: 1 },
    { letter: root.letter, accidental: -1 },
  ] as NoteName[];
  const distractors = shuffle([...extras, ...chromatic]).slice(0, 4);
  return { root, quality, chord, pool: shuffle([...chord, ...distractors]) };
}

interface OidRound {
  root: NoteName;
  quality: ChordQuality;
}

function makeOidRound(): OidRound {
  return { root: randomRoot(), quality: randomQuality() };
}

interface SymbolRound {
  chord: NoteName[];
  root: NoteName;
  quality: ChordQuality;
  options: string[];
}

function makeSymbolRound(): SymbolRound {
  const root = randomRoot();
  const quality = randomQuality();
  const chord = buildChord(root, quality);
  const answer = chordSymbol(root, quality);
  const distractorRoots = shuffle(CIRCLE_OF_FOURTHS.filter((k) => pc(k) !== pc(root))).slice(0, 3);
  const options = shuffle([
    answer,
    ...distractorRoots.map((r) => chordSymbol(r, randomQuality())),
  ]);
  return { chord, root, quality, options };
}

export function ChordBuilderGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = params.mode ?? 'construye';
  const total = TOTALS[mode] ?? 8;
  const bestScore = useProgress((s) => s.modeStats[modeKey('chord-builder', mode)]?.bestScore);
  const session = useSession({ gameId: 'chord-builder', modeId: mode, totalRounds: total });
  const { state, answer, persist, reset } = session;
  const playChord = usePlayChord();
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (state.phase === 'finished') persist();
  }, [state.phase, persist]);

  const [buildRound, setBuildRound] = useState(makeBuildRound);
  const [picked, setPicked] = useState<NoteName[]>([]);
  const [buildLocked, setBuildLocked] = useState(false);
  const [buildOk, setBuildOk] = useState<boolean | null>(null);

  const [oidRound, setOidRound] = useState(makeOidRound);
  const [oidLocked, setOidLocked] = useState(false);
  const [oidSelected, setOidSelected] = useState<ChordQuality | null>(null);
  const oidPlayedRef = useRef(false);

  const [symbolRound, setSymbolRound] = useState(makeSymbolRound);
  const [symbolLocked, setSymbolLocked] = useState(false);
  const [symbolSelected, setSymbolSelected] = useState<string | null>(null);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    setBuildRound(makeBuildRound());
    setPicked([]);
    setBuildLocked(false);
    setBuildOk(null);
    setOidRound(makeOidRound());
    setOidLocked(false);
    setOidSelected(null);
    oidPlayedRef.current = false;
    setSymbolRound(makeSymbolRound());
    setSymbolLocked(false);
    setSymbolSelected(null);
  }, [reset, clearTimers]);

  const togglePick = (note: NoteName) => {
    if (buildLocked) return;
    if (picked.some((p) => pc(p) === pc(note))) {
      setPicked(picked.filter((p) => pc(p) !== pc(note)));
      return;
    }
    if (picked.length >= 4) return;
    const next = [...picked, note];
    setPicked(next);
    if (next.length === 4) {
      setBuildLocked(true);
      const ok = buildRound.chord.every((c) => next.some((p) => pc(p) === pc(c)));
      setBuildOk(ok);
      if (ok) {
        const freqs = buildRound.chord.map((n2) => noteFreq(n2, 3));
        void playChord([...freqs.slice(0, 3), freqs[2] * 2]);
      }
      answer(ok);
      const t = window.setTimeout(() => {
        setBuildRound(makeBuildRound());
        setPicked([]);
        setBuildLocked(false);
        setBuildOk(null);
      }, 1700);
      timers.current.push(t);
    }
  };

  const playOid = async () => {
    const freqs = buildChord(oidRound.root, oidRound.quality).map((n2, i) =>
      noteFreq(n2, i > 0 && pc(n2) < pc(oidRound.root) ? 4 : 3),
    );
    await playChord(freqs, 1.4);
  };

  const answerOid = (quality: ChordQuality) => {
    if (oidLocked || state.phase === 'finished') return;
    const ok = quality === oidRound.quality;
    setOidLocked(true);
    setOidSelected(quality);
    answer(ok);
    const t = window.setTimeout(() => {
      setOidRound(makeOidRound());
      setOidLocked(false);
      setOidSelected(null);
      oidPlayedRef.current = false;
    }, 1600);
    timers.current.push(t);
  };

  const answerSymbol = (option: string) => {
    if (symbolLocked || state.phase === 'finished') return;
    const answerStr = chordSymbol(symbolRound.root, symbolRound.quality);
    const ok = option === answerStr;
    setSymbolLocked(true);
    setSymbolSelected(option);
    answer(ok);
    const t = window.setTimeout(() => {
      setSymbolRound(makeSymbolRound());
      setSymbolLocked(false);
      setSymbolSelected(null);
    }, 1600);
    timers.current.push(t);
  };

  if (state.phase === 'finished') {
    return (
      <GameShell title={MODES[mode] ?? 'El Constructor'} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/cuatriadas')}
          tip={TIPS[mode]}
        />
      </GameShell>
    );
  }

  if (mode === 'construye') {
    return (
      <GameShell
        title="Construye el acorde"
        subtitle={`${chordSymbol(buildRound.root, buildRound.quality)} · ${CHORD_LABELS[buildRound.quality]}`}
        state={state}
        totalRounds={total}
        feedback={
          buildOk !== null
            ? {
                tone: buildOk ? 'correct' : 'wrong',
                text: buildOk
                  ? `¡Exacto! ${buildRound.chord.map((n2) => noteToString(n2)).join(' · ')}`
                  : `La cuatriada correcta es: ${buildRound.chord.map((n2) => noteToString(n2)).join(' · ')}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-5 p-6">
          <p className="text-sm text-ink-muted">
            Selecciona las 4 notas de la cuatriada (el orden no importa).
          </p>
          <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border border-line bg-app-dark/40 p-3">
            {picked.length === 0 && <span className="text-sm text-ink-muted">Elige notas…</span>}
            {picked.map((note, i) => (
              <span
                key={i}
                className="animate-pop rounded-xl bg-primary-soft px-3 py-1.5 font-semibold text-primary"
              >
                {noteToString(note)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {buildRound.pool.map((note, i) => (
              <button
                key={i}
                type="button"
                disabled={buildLocked}
                onClick={() => togglePick(note)}
                className={`lift hover:-translate-y-0.5 hover:border-sheen focus-ring rounded-2xl border px-4 py-2.5 text-base font-semibold disabled:opacity-40 ${
                  picked.some((p) => pc(p) === pc(note))
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-app-light hover:border-sheen'
                }`}
              >
                {noteToString(note)}
              </button>
            ))}
          </div>
        </div>
      </GameShell>
    );
  }

  if (mode === 'calidad') {
    const answerStr = chordSymbol(oidRound.root, oidRound.quality);
    return (
      <GameShell
        title="Calidad por oído"
        subtitle="Escucha el acorde y elige su cualidad"
        state={state}
        totalRounds={total}
        footer={
          <Button variant="secondary" onClick={() => void playOid()}>
            🔊 Volver a escuchar
          </Button>
        }
        feedback={
          oidLocked
            ? {
                tone: oidSelected === oidRound.quality ? 'correct' : 'wrong',
                text:
                  oidSelected === oidRound.quality
                    ? `¡Era ${answerStr} (${CHORD_LABELS[oidRound.quality]})`
                    : `Era ${answerStr} (${CHORD_LABELS[oidRound.quality]})`,
              }
            : null
        }
      >
        <div className="panel flex flex-col items-center gap-6 p-8">
          <Button size="lg" onClick={() => void playOid()} disabled={oidLocked}>
            ▶ Escuchar acorde
          </Button>
          <OptionGrid cols={3}>
            {QUALITIES.map((q) => (
              <OptionButton
                key={q}
                disabled={oidLocked}
                state={
                  oidLocked
                    ? q === oidRound.quality
                      ? 'correct'
                      : oidSelected === q
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() => answerOid(q)}
              >
                {CHORD_SUFFIX[q]}
              </OptionButton>
            ))}
          </OptionGrid>
        </div>
      </GameShell>
    );
  }

  const answerStr = chordSymbol(symbolRound.root, symbolRound.quality);
  return (
    <GameShell
      title="Nombra el acorde"
      subtitle="¿Qué acorde forman estas 4 notas?"
      state={state}
      totalRounds={total}
      feedback={
        symbolLocked
          ? {
              tone: symbolSelected === answerStr ? 'correct' : 'wrong',
              text: symbolSelected === answerStr ? `¡Sí, ${answerStr}!` : `Era ${answerStr}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col gap-6 p-6">
        <div className="flex flex-wrap justify-center gap-3">
          {symbolRound.chord.map((note, i) => (
            <span
              key={i}
              className="rounded-2xl border border-line bg-app-light px-5 py-3 text-2xl font-bold"
            >
              {noteToString(note)}
            </span>
          ))}
        </div>
        <OptionGrid cols={3}>
          {symbolRound.options.map((option) => (
            <OptionButton
              key={option}
              disabled={symbolLocked}
              state={
                symbolLocked
                  ? option === answerStr
                    ? 'correct'
                    : symbolSelected === option
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
              onClick={() => answerSymbol(option)}
            >
              {option}
            </OptionButton>
          ))}
        </OptionGrid>
      </div>
    </GameShell>
  );
}
