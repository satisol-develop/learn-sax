import { Link } from 'react-router-dom';
import { ChevronLeft, PlayCircle } from 'lucide-react';
import { Card } from '../components/ui/primitives';

const BASE = import.meta.env.BASE_URL;

const STEPS = [
  {
    title: 'Qué es Learn Sax',
    detail: 'La plataforma y su enfoque: teoría breve más juegos de un minuto.',
  },
  {
    title: 'Cómo funciona',
    detail: 'Elige un recurso, lee la teoría y juega para fijar cada concepto.',
  },
  {
    title: 'Los recursos',
    detail: 'Escalas, círculo de 4as/5as, cuatriadas, ii-V-I, modos, blues y jam.',
  },
  {
    title: 'Tu instrumento',
    detail: 'Soprano y tenor en Si♭, alto en Mi♭: la transposición es automática.',
  },
  {
    title: 'Tu rutina',
    detail: 'Una sesión diaria guiada y una racha de práctica que se mantiene.',
  },
  {
    title: 'Tu progreso',
    detail: 'Estadísticas por modo, precisión y récords de cada juego.',
  },
];

export function GuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink focus-ring rounded-lg"
      >
        <ChevronLeft size={16} /> Inicio
      </Link>

      <header>
        <h1 className="text-2xl font-bold">Guía de la plataforma</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Un recorrido de un minuto por Learn Sax: qué es, cómo se practica y qué puedes seguir.
        </p>
      </header>

      <Card className="p-3">
        <video
          className="w-full rounded-xl border border-line bg-black"
          controls
          playsInline
          preload="metadata"
          poster={`${BASE}guides/learn-sax-guide-poster.jpg`}
        >
          <source src={`${BASE}guides/learn-sax-guide.mp4`} type="video/mp4" />
          Tu navegador no puede reproducir este vídeo.
        </video>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          <PlayCircle size={15} /> Qué verás
        </h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div>
                <div className="text-sm font-semibold">{step.title}</div>
                <p className="text-sm text-ink-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
