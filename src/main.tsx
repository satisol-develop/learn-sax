import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { ensureAudio } from './audio/engine';
import './styles/tokens.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

let audioWarmed = false;
const warmAudio = () => {
  if (audioWarmed) return;
  audioWarmed = true;
  void ensureAudio();
};
window.addEventListener('pointerdown', warmAudio, { once: true });
window.addEventListener('keydown', warmAudio, { once: true });

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
