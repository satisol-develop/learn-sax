import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Gamepad2,
  Music2,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { RESOURCES } from '../resources/registry';
import { buildRoutine, routineProgress, type RoutineKind } from '../progress/routine';
import { dayKey } from '../progress/habits';
import { useProgress } from '../progress/store';
import { Card, Chip, ProgressBar } from '../components/ui/primitives';
import { Button } from '../components/ui/Button';

const KIND_META: Record<RoutineKind, { icon: LucideIcon; label: string }> = {
  theory: { icon: BookOpen, label: 'Teoría' },
  game: { icon: Gamepad2, label: 'Juego' },
  jam: { icon: Music2, label: 'Impro' },
};

export function RoutinePage() {
  const routineDay = useProgress((s) => s.routineDay);
  const routineSteps = useProgress((s) => s.routineSteps);
  const dailyStreak = useProgress((s) => s.dailyStreak);

  // Se recalcula cada minuto para que la rutina cambie al pasar la medianoche.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const steps = buildRoutine(now, RESOURCES);
  const completed = routineDay === dayKey(now) ? routineSteps : [];
  const pct = routineProgress(steps, completed);
  const nextStep = steps.find((step) => !completed.includes(step.id));
  const allDone = steps.length > 0 && !nextStep;

  const rawDate = new Date(now).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Rutina de hoy</h1>
          {dailyStreak > 1 && (
            <Chip tone="warning">
              <Flame size={12} /> Racha {dailyStreak} días
            </Chip>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{dateLabel}</p>
      </header>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {allDone ? '¡Rutina completada!' : 'Tu plan de hoy'}
            </p>
            <p className="text-xs text-ink-muted">
              {completed.filter((id) => steps.some((s) => s.id === id)).length}/{steps.length}{' '}
              pasos · unos 10 minutos
            </p>
          </div>
          <span className="text-2xl font-bold tabular-nums text-primary">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
        {nextStep ? (
          <Link to={nextStep.to} className="focus-ring rounded-xl">
            <Button size="lg" className="w-full sm:w-auto">
              <Play size={16} fill="currentColor" />{' '}
              {completed.length === 0 ? 'Empezar' : 'Continuar'}: {nextStep.title}
            </Button>
          </Link>
        ) : (
          <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            ✅ Has completado la rutina. Vuelve mañana para una nueva.
          </p>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const done = completed.includes(step.id);
          const isNext = nextStep?.id === step.id;
          const Meta = KIND_META[step.kind];
          const Icon = Meta.icon;
          return (
            <Link key={step.id} to={step.to} className="group focus-ring rounded-[20px]">
              <Card
                interactive
                className={`flex items-center gap-3 ${
                  isNext ? 'border-primary/50' : ''
                }`}
              >
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                    done
                      ? 'bg-success/15 text-success'
                      : isNext
                        ? 'bg-primary text-white'
                        : 'bg-primary-soft text-primary'
                  }`}
                  aria-hidden
                >
                  {done ? <Check size={20} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-ink-muted">
                      <Icon size={12} className="mr-1 inline" aria-hidden />
                      {Meta.label}
                    </span>
                    {isNext && <Chip tone="primary">Ahora</Chip>}
                  </div>
                  <h2 className="mt-0.5 font-semibold">{step.title}</h2>
                  <p className="text-sm text-ink-muted">{step.detail}</p>
                </div>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                />
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
