import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Learn Sax error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <span className="text-xl font-bold">!</span>
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Algo ha fallado</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Ha habido un error inesperado. Recarga la página; si sigue fallando, avísame con lo
            que estabas haciendo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white focus-ring"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
