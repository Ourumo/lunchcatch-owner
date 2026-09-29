import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@repo/ui';

import App from './app/App.tsx';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
