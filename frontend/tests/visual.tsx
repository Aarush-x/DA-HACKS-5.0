// Development-only browser verification entry, excluded from the production build.
// Query: ?motion=reduce or ?scenario=error|ingredient-guide. No OS preferences are changed.
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
const scenario = params.get('scenario');
const api = scenario === 'error' ? {
  ...mockApi,
  async getProducts() { throw new ApiError(503, 'Test scenario: demo API unavailable. Retry remains in API mode.'); },
} : scenario === 'ingredient-guide' ? {
  ...mockApi,
  async getProducts(query: Parameters<typeof mockApi.getProducts>[0], signal?: AbortSignal) {
    const response = await mockApi.getProducts(query, signal);
    if (response.products[0]) response.products[0].ingredients_text = 'Whole grain oats, water, sugar, salt. Contains wheat.';
    return response;
  },
} : mockApi;
createRoot(document.getElementById('root')!).render(<React.StrictMode><App api={api} mode={scenario === 'error' ? 'api' : 'mock'}/></React.StrictMode>);
