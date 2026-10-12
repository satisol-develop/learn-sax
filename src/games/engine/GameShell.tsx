import type { ReactNode } from 'react';
import { Heart, Home, RotateCcw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/primitives';
import type { SessionState } from './session';

interface GameShellProps {
  title: string;
  subtitle?: string;
  state: SessionState;
  totalRounds: number;
  onQuit?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  feedback?: { tone: 'correct' | 'wrong'; text: string } | null;
}

export function GameShell({
  title,
  subtitle,
  state,
  totalRounds,
  onQuit,
  children,
  footer,
  feedback,
}: GameShellProps) {
  const navigate = useNavigate();
  const progressPct = Math.min(100, (state.round / totalRounds) * 100);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (onQuit ? onQuit() : navigate(-1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-app-light text-ink-muted hover:text-ink focus-ring"
          aria-label="Salir del juego"
        >
          <X size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary">
            {state.score} pts
          </span>
          {state.streak > 1 && (
            <span className="hidden rounded-full bg-warning/15 px-3 py-1 font-medium text-warning sm:inline">
              ×{state.streak} racha
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 font-medium text-danger">
            <Heart size={13} fill="currentColor" />
            {state.lives}
          </span>
        </div>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-app-light">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="flex-1">{children}</main>

      {feedback && (
        <div
          role="status"
          className={`animate-pop rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.tone === 'correct'
              ? 'border-success/30 bg-success/12 text-success'
              : 'border-danger/30 bg-danger/12 text-danger'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {footer && <div className="flex flex-wrap items-center gap-3">{footer}</div>}
    </div>
  );
}

interface GameResultsProps {
  state: SessionState;
  bestScore?: number;
  onRetry: () => void;
  onHome: () => void;
  tip?: string;
}

export function GameResults({ state, bestScore, onRetry, onHome, tip }: GameResultsProps) {
  const accuracy = state.answered > 0 ? Math.round((state.correct / state.answered) * 100) : 0;
  const isRecord = bestScore !== undefined && state.score > bestScore;
  return (
    <Card className="flex flex-col items-center gap-5 p-8 text-center">
      <div>
        <p className="text-sm font-medium text-ink-muted">Resultado</p>
        <h2 className="mt-1 text-3xl font-bold">
          {state.score} <span className="text-lg font-medium text-ink-muted">pts</span>
        </h2>
        {isRecord && (
          <span className="mt-2 inline-block rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
            ¡Nuevo récord!
          </span>
        )}
      </div>
      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        <div className="rounded-2xl bg-app-light/70 px-3 py-3">
          <div className="text-xs text-ink-muted">Aciertos</div>
          <div className="mt-1 text-lg font-semibold">
            {state.correct}/{state.answered}
          </div>
        </div>
        <div className="rounded-2xl bg-app-light/70 px-3 py-3">
          <div className="text-xs text-ink-muted">Precisión</div>
          <div className="mt-1 text-lg font-semibold">{accuracy}%</div>
        </div>
        <div className="rounded-2xl bg-app-light/70 px-3 py-3">
          <div className="text-xs text-ink-muted">Mejor racha</div>
          <div className="mt-1 text-lg font-semibold">{state.streak}</div>
        </div>
      </div>
      {tip && <p className="max-w-sm text-sm text-ink-muted">{tip}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onRetry} size="lg">
          <RotateCcw size={16} /> Jugar otra vez
        </Button>
        <Button variant="secondary" onClick={onHome} size="lg">
          <Home size={16} /> Volver
        </Button>
      </div>
    </Card>
  );
}
