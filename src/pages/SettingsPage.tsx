import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { INSTRUMENT_LABELS, noteToString, n, toWritten, type Instrument } from '../music/core';
import { useProgress, type PitchMode } from '../progress/store';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/primitives';

const INSTRUMENTS: Instrument[] = ['soprano', 'alto', 'tenor'];

export function SettingsPage() {
  const settings = useProgress((s) => s.settings);
  const setSettings = useProgress((s) => s.setSettings);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 md:px-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink focus-ring rounded-lg"
      >
        <ChevronLeft size={16} /> Inicio
      </Link>
      <header>
        <h1 className="text-2xl font-bold">Ajustes</h1>
      </header>

      <Card className="flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Instrumento
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Afecta a la clave escrita que verás en los juegos (opción «En mi sax»).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => setSettings({ instrument: inst })}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold focus-ring ${
                  settings.instrument === inst
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-app-light text-ink-muted hover:border-sheen'
                }`}
              >
                {INSTRUMENT_LABELS[inst]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Ejemplo: Do de concierto se escribe{' '}
            <span className="font-semibold text-ink">
              {noteToString(toWritten(n('C'), settings.instrument))}
            </span>{' '}
            en {INSTRUMENT_LABELS[settings.instrument]}.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Cifrado de notas
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                { id: 'concert', label: 'Tono de concierto', hint: 'Teoría estándar: C F Bb Eb…' },
                {
                  id: 'transposed',
                  label: 'En mi sax',
                  hint: 'Con tu instrumento en badges: C [A] en alto…',
                },
              ] as { id: PitchMode; label: string; hint: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSettings({ pitchMode: opt.id })}
                className={`rounded-xl border px-4 py-2.5 text-left text-sm focus-ring ${
                  settings.pitchMode === opt.id
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-app-light text-ink-muted hover:border-sheen'
                }`}
              >
                <span className="block font-semibold">{opt.label}</span>
                <span className="mt-0.5 block text-xs font-normal opacity-80">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Tema</h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setSettings({ theme: 'dark' })}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold focus-ring ${
                settings.theme === 'dark'
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-app-light text-ink-muted'
              }`}
            >
              <Moon size={14} /> Oscuro
            </button>
            <button
              type="button"
              onClick={() => setSettings({ theme: 'light' })}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold focus-ring ${
                settings.theme === 'light'
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-app-light text-ink-muted'
              }`}
            >
              <Sun size={14} /> Claro
            </button>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Datos</h2>
        <p className="text-sm text-ink-muted">
          El progreso se guarda localmente en tu navegador. Puedes reiniciarlo cuando quieras.
        </p>
        {confirmReset ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Sí, borrar todo
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="self-start" onClick={() => setConfirmReset(true)}>
            Reiniciar progreso
          </Button>
        )}
      </Card>
    </div>
  );
}
