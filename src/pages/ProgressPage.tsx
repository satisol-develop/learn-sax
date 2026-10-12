import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { RESOURCES } from '../resources/registry';
import { Card, Chip, EmptyState, ProgressBar } from '../components/ui/primitives';
import { accuracyOf, modeKey, useProgress } from '../progress/store';

export function ProgressPage() {
  const modeStats = useProgress((s) => s.modeStats);
  const hasData = Object.keys(modeStats).length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 md:px-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink focus-ring rounded-lg"
      >
        <ChevronLeft size={16} /> Inicio
      </Link>
      <header>
        <h1 className="text-2xl font-bold">Tu progreso</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Precisión y récords por modo de juego. Todo se guarda en este dispositivo.
        </p>
      </header>

      {!hasData ? (
        <EmptyState
          title="Aún no hay datos"
          description="Juega alguna partida y aquí verás tu precisión y tus mejores marcas."
          action={
            <Link to="/">
              <span className="text-sm font-semibold text-primary">Explorar recursos →</span>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {RESOURCES.filter((r) => r.modes.length > 0).map((resource) => (
            <Card key={resource.id} className="flex flex-col gap-3">
              <h2 className="font-semibold">{resource.title}</h2>
              <div className="flex flex-col gap-2">
                {resource.modes.map((mode) => {
                  const stat = modeStats[modeKey(resource.gameId, mode.id)];
                  if (!stat) {
                    return (
                      <div
                        key={mode.id}
                        className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm"
                      >
                        <span className="text-ink-muted">{mode.name}</span>
                        <Chip>Sin jugar</Chip>
                      </div>
                    );
                  }
                  const acc = accuracyOf(stat) ?? 0;
                  return (
                    <div
                      key={mode.id}
                      className="flex flex-col gap-2 rounded-xl border border-line bg-app-light/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{mode.name}</div>
                        <div className="text-xs text-ink-muted">
                          {stat.plays} partidas · mejor {stat.bestScore} pts · {stat.correct}/
                          {stat.answered} aciertos
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:w-48">
                        <ProgressBar value={acc} className="flex-1" />
                        <span className="w-10 text-right text-sm font-bold tabular-nums">{acc}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
