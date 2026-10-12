import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CIRCLE_OF_FOURTHS,
  INSTRUMENT_LABELS,
  KEY_SPELLINGS,
  noteFreq,
  noteToString,
  pc,
  toWritten,
  type NoteName,
} from '../../music/core';
import { pickRandom, shuffle } from '../../lib/random';
import { usePlayNotes } from '../../components/music/display';
import { Chip } from '../../components/ui/primitives';
import { GameResults, GameShell } from '../engine/GameShell';
import { OptionButton, OptionGrid } from '../engine/OptionButton';
import { useSession } from '../engine/session';
import { modeKey, useProgress } from '../../progress/store';

const MODE_NAMES: Record<string, string> = {
  escrita: 'Nota escrita',
  concierto: 'Nota de concierto',
  tonalidad: 'Tonalidad escrita',
};

const MODE_TOTALS: Record<string, number> = { escrita: 10, concierto: 10, tonalidad: 10 };

const MODE_TIPS: Record<string, string> = {
  escrita:
    'Sube el intervalo desde el concierto: el alto (Mi♭) escribe una 6ª mayor arriba (+9 semitonos); tenor y soprano (Si♭), una 2ª mayor (+2).',
  concierto:
    'Para volver al concierto baja la misma distancia: lo escrito en alto suena una 6ª mayor abajo; en tenor/soprano, una 2ª mayor abajo.',
  tonalidad:
    'Toda la tonalidad se transporta igual: Do de concierto se lee Re en tenor/soprano y La en alto.',
};

interface Round {
  concert: NoteName;
  written: NoteName;
  answer: NoteName;
  options: NoteName[];
}

/** 4 opciones (respuesta + 3 distractores) sin repetir clase de altura. */
function buildOptions(answer: NoteName): NoteName[] {
  const others = shuffle(KEY_SPELLINGS.filter((k) => pc(k) !== pc(answer))).slice(0, 3);
  return shuffle([answer, ...others]);
}

function makeRound(mode: string, written: NoteName, concert: NoteName): Round {
  const answer = mode === 'concierto' ? concert : written;
  return { concert, written, answer, options: buildOptions(answer) };
}

export function TransposeDrillGame() {
  const params = useParams();
  const navigate = useNavigate();
  const mode = MODE_NAMES[params.mode ?? ''] ? (params.mode as string) : 'escrita';
  const total = MODE_TOTALS[mode];
  const instrument = useProgress((s) => s.settings.instrument);
  const bestScore = useProgress((s) => s.modeStats[modeKey('transpose-drill', mode)]?.bestScore);
  const session = useSession({ gameId: 'transpose-drill', modeId: mode, totalRounds: total });
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

  const makeFresh = useCallback((): Round => {
    const concert = pickRandom(CIRCLE_OF_FOURTHS);
    const written = toWritten(concert, instrument);
    return makeRound(mode, written, concert);
  }, [instrument, mode]);

  const [round, setRound] = useState<Round>(makeFresh);
  const [locked, setLocked] = useState(false);
  const [selectedPc, setSelectedPc] = useState<number | null>(null);

  const restart = useCallback(() => {
    clearTimers();
    reset();
    setRound(makeFresh());
    setLocked(false);
    setSelectedPc(null);
  }, [reset, clearTimers, makeFresh]);

  const pick = (option: NoteName) => {
    if (locked || state.phase === 'finished') return;
    const isCorrect = pc(option) === pc(round.answer);
    setLocked(true);
    setSelectedPc(pc(option));
    if (isCorrect) void playNotes([noteFreq(round.concert, 4)], 0.35, 0);
    answer(isCorrect);
    const t = window.setTimeout(() => {
      setRound(makeFresh());
      setLocked(false);
      setSelectedPc(null);
    }, 1300);
    timers.current.push(t);
  };

  const instrumentChip = <Chip tone="primary">{INSTRUMENT_LABELS[instrument]}</Chip>;

  const prompt = (() => {
    if (mode === 'concierto') {
      return {
        label: `Escrito en ${INSTRUMENT_LABELS[instrument]}`,
        big: noteToString(round.written),
        question: '¿Qué nota suena de concierto?',
        echo: `${noteToString(round.written)} escrito = ${noteToString(round.concert)} de concierto`,
      };
    }
    if (mode === 'tonalidad') {
      return {
        label: 'Tonalidad de concierto',
        big: noteToString(round.concert),
        question: '¿Cómo se escribe esa tonalidad en tu saxo?',
        echo: `${noteToString(round.concert)} de concierto se escribe ${noteToString(round.written)}`,
      };
    }
    return {
      label: 'Nota de concierto',
      big: noteToString(round.concert),
      question: '¿Qué nota escribes en tu saxo?',
      echo: `${noteToString(round.concert)} de concierto se escribe ${noteToString(round.written)}`,
    };
  })();

  if (state.phase === 'finished') {
    return (
      <GameShell title={MODE_NAMES[mode]} state={state} totalRounds={total}>
        <GameResults
          state={state}
          bestScore={bestScore}
          onRetry={restart}
          onHome={() => navigate('/resource/transposicion')}
          tip={MODE_TIPS[mode]}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title={MODE_NAMES[mode]}
      subtitle={prompt.question}
      state={state}
      totalRounds={total}
      feedback={
        locked
          ? {
              tone: selectedPc === pc(round.answer) ? 'correct' : 'wrong',
              text:
                selectedPc === pc(round.answer)
                  ? `¡Correcto! ${prompt.echo}`
                  : `Ojo: ${prompt.echo}`,
            }
          : null
      }
    >
      <div className="panel flex flex-col items-center gap-6 p-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {instrumentChip}
          <Chip>{prompt.label}</Chip>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="rounded-2xl border border-line bg-app-light px-8 py-5 text-4xl font-bold text-primary">
            {prompt.big}
          </span>
        </div>
        <p className="text-center text-sm text-ink-muted">{prompt.question}</p>
        <OptionGrid cols={2}>
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
      </div>
    </GameShell>
  );
}
