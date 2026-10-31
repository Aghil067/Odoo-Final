/**
 * main.tsx
 * ─────────────────────────────────────────────────────────────
 * Application entry point.
 * Mounts the React app into the #root DOM element.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
