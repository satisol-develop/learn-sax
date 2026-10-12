import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  circleOf,
  cycleFrom,
  iiViIn,
  noteToString,
  pc,
  type CycleDirection,
  type NoteName,
} from '../../music/core';
import { jamPlayer, type SectionInfo } from '../../audio/backing';
import { ensureAudio } from '../../audio/engine';
import { CircleOfKeys } from '../../components/music/CircleOfKeys';
import { NoteText } from '../../components/music/display';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/primitives';
import { pickRandom } from '../../lib/random';

const CHORD_ROLES = ['ii', 'V', 'I'] as const;

interface JamConfig {
  cycle: CycleDirection;
  bpm: number;
  barsPerChord: 2 | 4;
  singleKeyLoop: boolean;
  countIn: boolean;
  startKey: NoteName;
}

function defaultConfig(): JamConfig {
  return {
    cycle: 'fourths',
    bpm: 100,
    barsPerChord: 2,
    singleKeyLoop: false,
    countIn: true,
    startKey: circleOf('fourths')[0],
  };
}

export function JamCycleGame() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<JamConfig>(defaultConfig);
  const [playing, setPlaying] = useState(false);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [beat, setBeat] = useState(0);
  const [bpmDraft, setBpmDraft] = useState(config.bpm);

  const stopJam = useCallback(() => {
    jamPlayer.stop();
    setPlaying(false);
    setSection(null);
    setBeat(0);
  }, []);

  useEffect(() => stopJam, [stopJam]);

  const startJam = async () => {
    await ensureAudio();
    setPlaying(true);
    jamPlayer.start(
      {
        bpm: config.bpm,
        cycle: config.cycle,
        barsPerChord: config.barsPerChord,
        startKey: config.startKey,
        singleKeyLoop: config.singleKeyLoop,
        countInBars: config.countIn ? 2 : 0,
      },
      {
        onSection: (info) => setSection(info),
        onBeat: (b) => setBeat(b),
      },
    );
  };

  const changeBpm = (bpm: number) => {
    setBpmDraft(bpm);
    setConfig((c) => ({ ...c, bpm }));
    jamPlayer.setBpm(bpm);
  };

  if (!playing || !section) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
        <header>
          <h1 className="text-2xl font-bold">Jam del Ciclo</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Backing track swing: ii-V-I viajando por el ciclo. Toca encima con tu sax.
          </p>
        </header>
        <Card className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Ciclo
              <div className="flex gap-2">
                {(['fourths', 'fifths'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({ ...c, cycle: dir, startKey: circleOf(dir)[0] }))
                    }
                    className={`flex-1 rounded-xl border px-3 py-2.5 font-semibold focus-ring ${
                      config.cycle === dir
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-line bg-app-light text-ink-muted'
                    }`}
                  >
                    {dir === 'fourths' ? 'Cuartas' : 'Quintas'}
                  </button>
                ))}
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Tonalidad de salida
              <select
                value={pc(config.startKey)}
                onChange={(e) => {
                  const pcv = Number(e.target.value);
                  const key = circleOf(config.cycle).find((k) => pc(k) === pcv);
                  if (key) setConfig((c) => ({ ...c, startKey: key }));
                }}
                className="rounded-xl border border-line bg-app-light px-3 py-2.5 text-base font-semibold text-ink focus-ring"
              >
                {circleOf(config.cycle).map((k) => (
                  <option key={noteToString(k)} value={pc(k)}>
                    {noteToString(k)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
              Tempo: <span className="text-primary">{bpmDraft} BPM</span>
              <input
                type="range"
                min={60}
                max={200}
                step={1}
                value={bpmDraft}
                onChange={(e) => setBpmDraft(Number(e.target.value))}
                onPointerUp={() => setConfig((c) => ({ ...c, bpm: bpmDraft }))}
                className="w-full accent-[var(--primary)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Compases por acorde
              <div className="flex gap-2">
                {([2, 4] as const).map((bars) => (
                  <button
                    key={bars}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, barsPerChord: bars }))}
                    className={`flex-1 rounded-xl border px-3 py-2.5 font-semibold focus-ring ${
                      config.barsPerChord === bars
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-line bg-app-light text-ink-muted'
                    }`}
                  >
                    {bars}
                  </button>
                ))}
              </div>
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium">
              Opciones
              <label className="flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  checked={config.singleKeyLoop}
                  onChange={(e) => setConfig((c) => ({ ...c, singleKeyLoop: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Una sola tonalidad en bucle
              </label>
              <label className="flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  checked={config.countIn}
                  onChange={(e) => setConfig((c) => ({ ...c, countIn: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Cuenta atrás (2 compases)
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => void startJam()}>
              ▶ Empezar jam
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setConfig((c) => ({ ...c, startKey: pickRandom(circleOf(c.cycle)) }))}
            >
              🎲 Tonalidad aleatoria
            </Button>
            <Button variant="ghost" onClick={() => navigate('/resource/impro-ii-v-i')}>
              Volver al recurso
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { progression, chordIdx, key, keyIdx, isCountIn, symbol, barInSection, barsPerChord } =
    section;
  const notes = progression.notes[chordIdx];
  const nextChordIdx = ((chordIdx + 1) % 3) as 0 | 1 | 2;
  const nextKeyIdx = (keyIdx + (chordIdx === 2 ? 1 : 0)) % 12;
  const cycle = cycleFrom(config.startKey, config.cycle);
  const nextKey = config.singleKeyLoop ? key : cycle[nextKeyIdx];
  const nextProgression = iiViIn(nextKey);
  const nextSymbol = nextProgression.symbols[nextChordIdx];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Jam del Ciclo</h1>
          <p className="text-sm text-ink-muted">
            {config.cycle === 'fourths' ? 'Cuartas' : 'Quintas'} · {bpmDraft} BPM ·{' '}
            {config.barsPerChord} compases/ acorde
          </p>
        </div>
        <Button variant="danger" onClick={stopJam}>
          ■ Parar
        </Button>
      </header>

      <Card className="flex flex-col items-center gap-5 p-6">
        {isCountIn ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-ink-muted">Cuenta atrás</p>
            <p className="mt-2 text-5xl font-bold text-primary">{beat + 1}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
                {CHORD_ROLES[chordIdx]}
              </span>
              <span className="text-sm text-ink-muted">
                clave {keyIdx + 1}/12 · compás {barInSection + 1}/{barsPerChord}
              </span>
            </div>
            <div className="text-5xl font-bold tracking-tight sm:text-6xl">{symbol}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {notes.map((note, i) => (
                <span
                  key={i}
                  className="rounded-xl border border-line bg-app-light px-3 py-1.5 text-lg font-semibold"
                >
                  <NoteText note={note} />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5" aria-label={`Compás ${beat + 1} de 4`}>
              {[0, 1, 2, 3].map((b) => (
                <span
                  key={b}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    b === beat ? 'bg-primary' : 'bg-app-light border border-line'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span>Sigue:</span>
              <span className="font-semibold text-ink">{nextSymbol}</span>
            </div>
          </>
        )}
        <CircleOfKeys
          direction={config.cycle}
          activeKey={isCountIn ? null : key}
          size={230}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Tempo en vivo</span>
          <span className="text-sm font-bold text-primary">{bpmDraft} BPM</span>
        </div>
        <input
          type="range"
          min={60}
          max={200}
          step={1}
          value={bpmDraft}
          onChange={(e) => changeBpm(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
        <p className="text-xs text-ink-muted">
          Arpegia las cuatriadas que ves, guíate por la 3ª y la 7ª, y deja respirar tu fraseo.
        </p>
      </Card>
    </div>
  );
}
