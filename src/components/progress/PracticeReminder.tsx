import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check, Flame, ListChecks } from 'lucide-react';
import { RESOURCES } from '../../resources/registry';
import { useProgress } from '../../progress/store';
import { dayKey, hasPracticedOn, weekOverview, type DayMark } from '../../progress/habits';
import { buildRoutine } from '../../progress/routine';
import { Card, Chip } from '../ui/primitives';

function DayStrip({ marks }: { marks: DayMark[] }) {
  return (
    <div className="flex gap-1.5" role="img" aria-label="Repasos de los últimos 7 días">
      {marks.map((mark) => (
        <span
          key={mark.key}
          title={mark.done ? `Repasado el ${mark.key}` : `Sin repasar el ${mark.key}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
            mark.done
              ? 'bg-success/20 text-success'
              : 'border border-line bg-app-light/60 text-ink-muted'
          } ${mark.isToday ? 'ring-2 ring-primary/60' : ''}`}
        >
          {mark.letter}
        </span>
      ))}
    </div>
  );
}

export function PracticeReminder() {
  const practiceDays = useProgress((s) => s.practiceDays);
  const dailyStreak = useProgress((s) => s.dailyStreak);
  const routineDay = useProgress((s) => s.routineDay);
  const routineSteps = useProgress((s) => s.routineSteps);

  // Se recalcula cada minuto para que el recordatorio cambie al pasar la medianoche.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const practicedToday = hasPracticedOn(practiceDays, now);
  const marks = weekOverview(practiceDays, now);

  const today = dayKey(now);
  const routine = buildRoutine(now, RESOURCES);
  const completed = routineDay === today ? routineSteps : [];
  const doneCount = routine.filter((step) => completed.includes(step.id)).length;

  return (
    <Card
      className={`border ${
        practicedToday ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3 sm:flex-1">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              practicedToday ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}
          >
            {practicedToday ? <Check size={20} /> : <BellRing size={20} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                {practicedToday ? 'Hoy ya repasaste' : 'Hoy aún no has repasado'}
              </h2>
              {dailyStreak > 1 && (
                <Chip tone="warning">
                  <Flame size={12} /> Racha {dailyStreak} días
                </Chip>
              )}
              {routine.length > 0 && (
                <Chip tone={doneCount === routine.length ? 'success' : 'primary'}>
                  <ListChecks size={12} /> Rutina {doneCount}/{routine.length}
                </Chip>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {practicedToday
                ? 'Buen trabajo. Vuelve mañana para mantener la racha.'
                : 'Sigue tu rutina de hoy: teoría, dos juegos y algo de jam en unos minutos.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <DayStrip marks={marks} />
          {!practicedToday && routine.length > 0 && (
            <Link
              to="/routine"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-warning px-3.5 py-2 text-sm font-semibold text-app-dark transition-[filter] hover:brightness-110 focus-ring"
            >
              Empezar rutina
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
