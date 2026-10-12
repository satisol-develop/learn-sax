import { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { BarChart3, CalendarCheck, Home, Settings } from 'lucide-react';
import { useProgress } from '../progress/store';
import { HomePage } from '../pages/HomePage';
import { ResourcePage } from '../pages/ResourcePage';
import { RoutinePage } from '../pages/RoutinePage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ScaleSprintGame } from '../games/scale-sprint/ScaleSprintGame';
import { CircleOrbitGame } from '../games/circle-orbit/CircleOrbitGame';
import { ChordBuilderGame } from '../games/chord-builder/ChordBuilderGame';
import { IiviChainGame } from '../games/iivi-chain/IiviChainGame';
import { TransposeDrillGame } from '../games/transpose-drill/TransposeDrillGame';
import { JamCycleGame } from '../games/jam-cycle/JamCycleGame';
import { EmptyState } from '../components/ui/primitives';

function GameRoute() {
  const { gameId } = useParams();
  switch (gameId) {
    case 'scale-sprint':
      return <ScaleSprintGame />;
    case 'circle-orbit':
      return <CircleOrbitGame />;
    case 'chord-builder':
      return <ChordBuilderGame />;
    case 'iivi-chain':
      return <IiviChainGame />;
    case 'transpose-drill':
      return <TransposeDrillGame />;
    case 'jam-cycle':
      return <JamCycleGame />;
    default:
      return (
        <div className="px-4 py-10">
          <EmptyState title="Juego no encontrado" description="Vuelve al inicio para elegir uno." />
        </div>
      );
  }
}

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/routine', label: 'Rutina', icon: CalendarCheck },
  { to: '/progress', label: 'Progreso', icon: BarChart3 },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function App() {
  const theme = useProgress((s) => s.settings.theme);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f5f8' : '#111318');
  }, [theme]);

  useEffect(() => {
    const path = location.pathname;
    document.title = path.startsWith('/game/')
      ? 'Jugando · Learn Sax'
      : path.startsWith('/resource/')
        ? 'Recurso · Learn Sax'
        : path === '/routine'
          ? 'Rutina · Learn Sax'
          : path === '/progress'
            ? 'Progreso · Learn Sax'
            : path === '/settings'
              ? 'Ajustes · Learn Sax'
              : 'Learn Sax';
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-app-dark text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-app px-4 py-6 md:flex">
        <NavLink to="/" className="flex items-center gap-2.5 focus-ring rounded-xl px-1 py-1">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold">
            S
          </span>
          <span className="text-lg font-bold">Learn Sax</span>
        </NavLink>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink-muted hover:bg-app-light hover:text-ink'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-1 text-xs leading-relaxed text-ink-muted">
          Entrena escalas, círculo, cuatriadas y ii-V-I para improvisar con soltura.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-app/90 px-4 py-3 backdrop-blur md:hidden"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <NavLink to="/" className="flex items-center gap-2 focus-ring rounded-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">
              S
            </span>
            <span className="font-bold">Learn Sax</span>
          </NavLink>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `inline-flex h-10 w-10 items-center justify-center rounded-xl focus-ring ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted'
                  }`
                }
                aria-label={item.label}
              >
                <item.icon size={17} />
              </NavLink>
            ))}
          </nav>
        </header>

        <main
          className="flex-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/routine" element={<RoutinePage />} />
            <Route path="/resource/:id" element={<ResourcePage />} />
            <Route path="/game/:gameId" element={<GameRoute />} />
            <Route path="/game/:gameId/:mode" element={<GameRoute />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
