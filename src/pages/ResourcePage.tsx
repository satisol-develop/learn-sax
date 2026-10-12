import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Timer } from 'lucide-react';
import { getResource } from '../resources/registry';
import { Button } from '../components/ui/Button';
import { Card, Chip, EmptyState } from '../components/ui/primitives';
import { accuracyOf, modeKey, useProgress } from '../progress/store';

export function ResourcePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resource = getResource(id);
  const modeStats = useProgress((s) => s.modeStats);
  const touchPractice = useProgress((s) => s.touchPractice);
  const markRoutineStep = useProgress((s) => s.markRoutineStep);

  useEffect(() => {
    if (!resource) return;
    touchPractice();
    markRoutineStep(`theory:${resource.id}`);
  }, [resource, touchPractice, markRoutineStep]);

  if (!resource) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          title="Recurso no encontrado"
          description="Puede que el enlace esté roto."
          action={
            <Button onClick={() => navigate('/')}>Volver al inicio</Button>
          }
        />
      </div>
    );
  }

  const Icon = resource.icon;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink focus-ring rounded-lg"
      >
        <ChevronLeft size={16} /> Inicio
      </Link>

      <header className="flex items-center gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{resource.title}</h1>
          <p className="text-sm text-ink-muted">{resource.subtitle}</p>
        </div>
      </header>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Repaso</h2>
        <p className="text-sm leading-relaxed">{resource.theory.intro}</p>
        <ul className="flex flex-col gap-2 text-sm">
          {resource.theory.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-xl border border-line bg-app-light/60 px-3 py-2 text-sm text-ink-muted">
          💡 {resource.theory.tip}
        </p>
      </Card>

      {resource.jam ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{resource.gameName}</h2>
              <p className="text-sm text-ink-muted">
                Configura el backing track y toca encima.
              </p>
            </div>
            <Button onClick={() => navigate(`/game/${resource.gameId}/jam`)} size="lg">
              <Play size={16} fill="currentColor" /> Abrir jam
            </Button>
          </div>
        </Card>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{resource.gameName}</h2>
          {resource.modes.map((mode) => {
            const stat = modeStats[modeKey(resource.gameId, mode.id)];
            const acc = accuracyOf(stat);
            return (
              <Link
                key={mode.id}
                to={`/game/${resource.gameId}/${mode.id}`}
                className="group focus-ring rounded-[20px]"
              >
                <Card interactive className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{mode.name}</h3>
                      <Chip
                        tone={
                          mode.difficulty === 3
                            ? 'warning'
                            : mode.difficulty === 2
                              ? 'primary'
                              : 'neutral'
                        }
                      >
                        {mode.difficulty === 1 ? 'Suave' : mode.difficulty === 2 ? 'Medio' : 'Intenso'}
                      </Chip>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{mode.description}</p>
                    {stat && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                        <Timer size={12} aria-hidden /> {stat.plays} partidas · mejor {stat.bestScore} pts
                        {acc !== null && ` · ${acc}% precisión`}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-[filter] group-hover:brightness-110">
                    <Play size={14} fill="currentColor" aria-hidden /> Jugar
                  </span>
                </Card>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
