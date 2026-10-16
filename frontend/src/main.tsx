import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { configure } from './lib/api';
import './styles.css';
const root = createRoot(document.getElementById('root')!);
try {
  const config = configure(import.meta.env.VITE_DATA_MODE, import.meta.env.VITE_API_BASE_URL);
  root.render(<React.StrictMode><App {...config} /></React.StrictMode>);
} catch (error) {
  root.render(<main><h1>Check frontend configuration</h1><p role="alert">{error instanceof Error ? error.message : 'Invalid configuration.'}</p><p>Correct the environment values and restart the frontend.</p></main>);
}
