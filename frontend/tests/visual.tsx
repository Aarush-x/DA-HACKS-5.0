// Development-only browser verification entry, excluded from the production build.
// Query: ?motion=reduce or ?scenario=error. No OS preferences are changed.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles.css';

if (!import.meta.env.DEV) throw new Error('This verification entry is development-only.');
const params = new URLSearchParams(location.search);
if (params.get('motion') === 'reduce') {
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query: string) => {
    const result = nativeMatchMedia(query);
    if (query.includes('prefers-reduced-motion')) {
      Object.defineProperty(result, 'matches', { value: query.includes(': reduce'), configurable: true });
    }
    return result;
  };
}
document.documentElement.dataset.testMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'normal';
const { App } = await import('../src/App');
const { mockApi, ApiError } = await import('../src/lib/api');
const api = params.get('scenario') === 'error' ? {
  ...mockApi,
  async getProducts() { throw new ApiError(503, 'Test scenario: demo API unavailable. Retry remains in API mode.'); },
} : mockApi;
createRoot(document.getElementById('root')!).render(<React.StrictMode><App api={api} mode={params.get('scenario') === 'error' ? 'api' : 'mock'}/></React.StrictMode>);
