import { Link } from 'react-router-dom';
import { ArrowRight, Music } from 'lucide-react';
import { RESOURCES } from '../resources/registry';
import { Card, Chip, ProgressBar } from '../components/ui/primitives';
import { PracticeReminder } from '../components/progress/PracticeReminder';
import { modeKey, useProgress } from '../progress/store';
import { INSTRUMENT_LABELS } from '../music/core';

export function HomePage() {
  const modeStats = useProgress((s) => s.modeStats);
  const instrument = useProgress((s) => s.settings.instrument);

  const resourceProgress = (gameId: string, modes: { id: string }[]) => {
    const stats = modes
      .map((m) => modeStats[modeKey(gameId, m.id)])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (stats.length === 0) return null;
    const correct = stats.reduce((a, s) => a + s.correct, 0);
    const answered = stats.reduce((a, s) => a + s.answered, 0);
    const plays = stats.reduce((a, s) => a + s.plays, 0);
    return { pct: answered ? Math.round((correct / answered) * 100) : 0, plays };
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Learn Sax</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Practica los conceptos de clase con juegos: escalas, círculo, cuatriadas, ii-V-I e impro.
          </p>
        </div>
        <Chip tone="primary">
          <Music size={12} /> {INSTRUMENT_LABELS[instrument]}
        </Chip>
      </header>

      <PracticeReminder />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => {
          const progress =
            resource.modes.length > 0
              ? resourceProgress(resource.gameId, resource.modes)
              : null;
          const Icon = resource.icon;
          return (
            <Link key={resource.id} to={`/resource/${resource.id}`} className="group">
              <Card interactive className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon size={20} />
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-ink-muted transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{resource.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{resource.subtitle}</p>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  {progress ? (
                    <>
                      <div className="flex justify-between text-xs text-ink-muted">
                        <span>{progress.plays} partidas</span>
                        <span className="font-semibold text-ink">{progress.pct}%</span>
                      </div>
                      <ProgressBar value={progress.pct} />
                    </>
                  ) : (
                    <span className="text-xs text-ink-muted">Sin practicar aún</span>
                  )}
                  <span className="text-sm font-semibold text-primary">{resource.gameName}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
