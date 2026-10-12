import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CIRCLE_OF_FOURTHS,
  noteFreq,
  noteToString,
  pc,
  SCALE_TYPES,
  type NoteName,
  type ScaleTypeDef,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { usePlayNotes } from '../../components/music/display';
import { Chip } from '../../components/ui/primitives';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODE_NAMES: Record<string, string> = {
  nombra: 'Nombra la escala',
  ordena: 'Ordena el modo',
  siguiente: '¿Qué nota sigue?',
};

const MODE_TOTALS: Record<string, number> = { nombra: 10, ordena: 6, siguiente: 10 };

const MODE_TIPS: Record<string, string> = {
  nombra:
    'Fíjate en la 3ª y la 6ª/7ª: el Dórico tiene ♮6, el Frigio ♭2, el Lidio ♯4 y el Mixolidio ♭7.',
  ordena: 'Un modo es la escala mayor empezada desde otro grado: una letra por nota.',
  siguiente: 'Cada modo tiene sus alteraciones fijas: memoriza el patrón y lo reconocerás al oído.',
};

function randomKey(): NoteName {
  return pickRandom(CIRCLE_OF_FOURTHS);
}

function randomType(): ScaleTypeDef {
  return pickRandom(SCALE_TYPES);
}

function scaleOf(type: ScaleTypeDef, key: NoteName): NoteName[] {
  return type.build(key);
}

interface NombraRound {
  type: ScaleTypeDef;
  key: NoteName;
  scale: NoteName[];
  options: string[];
}

function makeNombraRound(): NombraRound {
  const type = randomType();
  const key = randomKey();
  const scale = scaleOf(type, key);
  const distractors = shuffle(SCALE_TYPES.filter((t) => t.id !== type.id)).slice(0, 3);
  return { type, key, scale, options: shuffle([type.label, ...distractors.map((t) => t.label)]) };
}

interface OrdenaRound {
  type: ScaleTypeDef;
  key: NoteName;
  scale: NoteName[];
  pool: NoteName[];
  picked: NoteName[];
}

function makeOrdenaRound(): OrdenaRound {
  const type = randomType();
  const key = randomKey();
  const scale = scaleOf(type, key);
  return { type, key, scale, pool: shuffle(scale), picked: [] };
}

interface SiguienteRound {
  type: ScaleTypeDef;
  key: NoteName;
  scale: NoteName[];
  prefix: NoteName[];
  answer: NoteName;
  options: NoteName[];
}

function makeSiguienteRound(): SiguienteRound {
  const type = randomType();
  const key = randomKey();
  const scale = scaleOf(type, key);
  const degree = 1 + Math.floor(Math.random() * (scale.length - 2));
  const answer = scale[degree];
  const others = scale.filter((note) => pc(note) !== pc(answer));
  const options = shuffle([answer, ...shuffle(others).slice(0, 3)]);
  return { type, key, scale, prefix: scale.slice(0, degree), answer, options };
}

export function ModeDrillGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = MODE_NAMES[params.mode ?? ''] ? (params.mode as string) : 'nombra';
  const total = MODE_TOTALS[mode];
  const bestScore = useProgress((s) => s.modeStats[modeKey('mode-drill', mode)]?.bestScore);
  const session = useSession({ gameId: 'mode-drill', modeId: mode, totalRounds: total });
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

  const [nombraRound, setNombraRound] = useState(makeNombraRound);
  const [nombraLocked, setNombraLocked] = useState(false);
  const [nombraSelected, setNombraSelected] = useState<string | null>(null);

  const [ordenaRound, setOrdenaRound] = useState<OrdenaRound>(makeOrdenaRound);
  const [ordenaLocked, setOrdenaLocked] = useState(false);
  const [ordenaReveal, setOrdenaReveal] = useState<string | null>(null);

  const [siguienteRound, setSiguienteRound] = useState(makeSiguienteRound);
  const [siguienteLocked, setSiguienteLocked] = useState(false);
  const [siguienteSelectedPc, setSiguienteSelectedPc] = useState<number | null>(null);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    setNombraRound(makeNombraRound());
    setNombraLocked(false);
    setNombraSelected(null);
    setOrdenaRound(makeOrdenaRound());
    setOrdenaLocked(false);
    setOrdenaReveal(null);
    setSiguienteRound(makeSiguienteRound());
    setSiguienteLocked(false);
    setSiguienteSelectedPc(null);
  }, [reset, clearTimers]);

  const answerNombra = (option: string) => {
    if (nombraLocked || state.phase === 'finished') return;
    const ok = option === nombraRound.type.label;
    setNombraLocked(true);
    setNombraSelected(option);
    answer(ok);
    const t = window.setTimeout(() => {
      setNombraRound(makeNombraRound());
      setNombraLocked(false);
      setNombraSelected(null);
    }, 1600);
    timers.current.push(t);
  };

  const pickOrdena = (note: NoteName) => {
    if (ordenaLocked) return;
    void playNotes([noteFreq(note, 4)], 0.3, 0);
    const picked = [...ordenaRound.picked, note];
    const poolIdx = ordenaRound.pool.findIndex((n2) => pc(n2) === pc(note));
    const pool = poolIdx >= 0 ? ordenaRound.pool.filter((_, i) => i !== poolIdx) : ordenaRound.pool;
    if (picked.length === ordenaRound.scale.length) {
      setOrdenaRound({ ...ordenaRound, picked, pool });
      setOrdenaLocked(true);
      const ok = picked.every((n2, i) => pc(n2) === pc(ordenaRound.scale[i]));
      setOrdenaReveal(ok ? 'ok' : ordenaRound.scale.map(noteToString).join(' '));
      answer(ok);
      const t = window.setTimeout(() => {
        setOrdenaRound(makeOrdenaRound());
        setOrdenaLocked(false);
        setOrdenaReveal(null);
      }, 1700);
      timers.current.push(t);
      return;
    }
    setOrdenaRound({ ...ordenaRound, picked, pool });
  };

  const answerSiguiente = (option: NoteName) => {
    if (siguienteLocked || state.phase === 'finished') return;
    const ok = pc(option) === pc(siguienteRound.answer);
    setSiguienteLocked(true);
    setSiguienteSelectedPc(pc(option));
    if (ok) void playNotes([noteFreq(siguienteRound.answer, 4)], 0.35, 0);
    answer(ok);
    const t = window.setTimeout(() => {
      setSiguienteRound(makeSiguienteRound());
      setSiguienteLocked(false);
      setSiguienteSelectedPc(null);
    }, 1300);
    timers.current.push(t);
  };

  if (state.phase === 'finished') {
    return (
      <GameShell title={MODE_NAMES[mode]} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/modos-escalas')}
          tip={MODE_TIPS[mode]}
        />
      </GameShell>
    );
  }

  if (mode === 'ordena') {
    return (
      <GameShell
        title="Ordena el modo"
        subtitle={`${ordenaRound.type.label} de ${noteToString(ordenaRound.key)}`}
        state={state}
        totalRounds={total}
        feedback={
          ordenaReveal !== null
            ? {
                tone: ordenaReveal === 'ok' ? 'correct' : 'wrong',
                text:
                  ordenaReveal === 'ok'
                    ? `¡Exacto! ${ordenaRound.scale.map(noteToString).join(' ')}`
                    : `La escala correcta es: ${ordenaReveal}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-5 p-6">
          <p className="text-sm text-ink-muted">
            Toca las notas en orden ascendente para construir el modo.
          </p>
          <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border border-line bg-app-dark/40 p-3">
            {ordenaRound.picked.length === 0 && (
              <span className="text-sm text-ink-muted">Empieza por la tónica…</span>
            )}
            {ordenaRound.picked.map((note, i) => (
              <span
                key={i}
                className="animate-pop rounded-xl bg-primary-soft px-3 py-1.5 font-semibold text-primary"
              >
                {noteToString(note)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ordenaRound.pool.map((note, i) => (
              <button
                key={i}
                type="button"
                disabled={ordenaLocked}
                onClick={() => pickOrdena(note)}
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
        subtitle={`${siguienteRound.type.label} de ${noteToString(siguienteRound.key)}`}
        state={state}
        totalRounds={total}
        feedback={
          siguienteLocked
            ? {
                tone: siguienteSelectedPc === pc(siguienteRound.answer) ? 'correct' : 'wrong',
                text:
                  siguienteSelectedPc === pc(siguienteRound.answer)
                    ? `¡Sí! Sigue ${noteToString(siguienteRound.answer)}`
                    : `Seguía ${noteToString(siguienteRound.answer)}`,
              }
            : null
        }
      >
        <div className="panel flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            {siguienteRound.prefix.map((note, i) => (
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
          <OptionGrid cols={2}>
            {siguienteRound.options.map((option) => (
              <OptionButton
                key={noteToString(option)}
                disabled={siguienteLocked}
                state={
                  siguienteLocked
                    ? pc(option) === pc(siguienteRound.answer)
                      ? 'correct'
                      : siguienteSelectedPc === pc(option)
                        ? 'wrong'
                        : 'default'
                    : 'default'
                }
                onClick={() => answerSiguiente(option)}
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
      title="Nombra la escala"
      subtitle="¿Qué tipo de escala son estas notas?"
      state={state}
      totalRounds={total}
      feedback={
        nombraLocked
          ? {
              tone: nombraSelected === nombraRound.type.label ? 'correct' : 'wrong',
              text:
                nombraSelected === nombraRound.type.label
                  ? `¡Correcto! ${nombraRound.scale.map(noteToString).join(' ')}`
                  : `Era ${nombraRound.type.label}: ${nombraRound.scale.map(noteToString).join(' ')}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col items-center gap-6 p-6">
        <Chip tone="primary">Tónica {noteToString(nombraRound.key)}</Chip>
        <div className="flex flex-wrap justify-center gap-2">
          {nombraRound.scale.map((note, i) => (
            <span
              key={i}
              className="rounded-2xl border border-line bg-app-light px-4 py-3 text-xl font-bold"
            >
              {noteToString(note)}
            </span>
          ))}
        </div>
        <OptionGrid cols={2}>
          {nombraRound.options.map((option) => (
            <OptionButton
              key={option}
              disabled={nombraLocked}
              state={
                nombraLocked
                  ? option === nombraRound.type.label
                    ? 'correct'
                    : nombraSelected === option
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
              onClick={() => answerNombra(option)}
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
