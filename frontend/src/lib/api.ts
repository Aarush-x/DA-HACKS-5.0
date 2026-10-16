import type { CatalogResponse, Category, Priority, StoresResponse, IngredientResponse } from '../types';
import balanced from '../mocks/products-balanced.json';
import fiber from '../mocks/products-fiber.json';
import sodium from '../mocks/products-sodium.json';
import stores from '../mocks/stores.json';
import ingredient from '../mocks/ingredient.json';

export type Query = { store_id: string; category?: Category; q?: string; priority?: Priority };
export interface Api {
  getStores(signal?: AbortSignal): Promise<StoresResponse>;
  getProducts(query: Query, signal?: AbortSignal): Promise<CatalogResponse>;
  getIngredient(id: string, signal?: AbortSignal): Promise<IngredientResponse>;
}
export class ApiError extends Error {
  constructor(public status: number, message: string, public code = 'request_failed', public requestId = '') { super(message); }
}
const fail = (status: number, message: string) => { throw new ApiError(status, message, status === 404 ? 'not_found' : 'validation_error', 'fixture-request'); };
export const mockApi: Api = {
  async getStores(signal) { signal?.throwIfAborted(); return structuredClone(stores) as StoresResponse; },
  async getProducts(query, signal) {
    signal?.throwIfAborted();
    const priority = query.priority ?? 'balanced';
    if (!query.store_id || !['balanced', 'fiber', 'sodium'].includes(priority) || (query.category !== undefined && !['bread', 'cereal'].includes(query.category)) || (query.q?.length ?? 0) > 100) fail(422, 'Check the store, category, search length and priority.');
    if (!['demo-store-a', 'demo-store-b'].includes(query.store_id)) fail(404, 'Demo store not found.');
    const data = structuredClone(({ balanced, fiber, sodium })[priority]) as CatalogResponse;
    const q = query.q?.trim().toLowerCase() ?? '';
    data.products = data.products.filter(p => (query.store_id === 'demo-store-a' || !p.id.endsWith('03')) && (!query.category || p.category === query.category) && [p.category, p.name, p.brand].some(s => s.toLowerCase().includes(q)));
    const ranks = { bread: 0, cereal: 0 };
    for (const p of data.products) {
      p.availability.store_id = query.store_id;
      if (p.ranking.status === 'ranked') p.ranking.rank = ++ranks[p.category];
      // Keep precomputed fixture ordering. Comparisons below are copy, not a new scoring algorithm.
      p.ranking.reasons = p.ranking.reasons.filter(r => r.kind === 'note');
      const peers = data.products.filter(other => other.category === p.category && other.id !== p.id);
      const n = p.nutrition_per_reference;
      if (peers.length && peers.every(other => n.fiber_g !== null && other.nutrition_per_reference.fiber_g !== null && n.fiber_g > other.nutrition_per_reference.fiber_g)) p.ranking.reasons.push({ kind: 'strength', text: 'More fiber at equal weight than the other results in this category.' });
      if (peers.length && peers.every(other => n.sodium_mg !== null && other.nutrition_per_reference.sodium_mg !== null && n.sodium_mg > other.nutrition_per_reference.sodium_mg)) p.ranking.reasons.push({ kind: 'tradeoff', text: 'Also more sodium at equal weight than the other results in this category.' });
    }
    data.meta.store_id = query.store_id; data.meta.total = data.products.length;
    return data;
  },
  async getIngredient(id, signal) { signal?.throwIfAborted(); if (id !== ingredient.id) fail(404, 'Ingredient explanation unavailable. This does not imply danger.'); return structuredClone(ingredient) as IngredientResponse; },
};
export function originOnly(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('VITE_API_BASE_URL must be a valid HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('VITE_API_BASE_URL must contain only an HTTP(S) origin, without a path or credentials.');
  return url.origin;
}
export function httpApi(origin: string, fetcher: typeof fetch = fetch, timeoutMs = 30000): Api {
  const base = originOnly(origin);
  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetcher(`${base}/api/v1${path}`, { signal: controller.signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(response.status, body?.error?.message ?? `Request failed (${response.status}).`, body?.error?.code, body?.error?.request_id);
      if (!body || typeof body !== 'object') throw new ApiError(502, 'The API returned an invalid JSON response.');
      return body as T;
    } catch (e) {
      if (timedOut) throw new ApiError(408, 'The request timed out after waiting. Please retry.');
      if (signal?.aborted || e instanceof ApiError) throw e;
      throw new ApiError(0, 'Could not reach the demo API. Check the connection and retry.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    getStores: signal => get<StoresResponse>('/stores', signal),
    getProducts: (query, signal) => { const params = new URLSearchParams(); Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(key, value); }); return get<CatalogResponse>(`/products?${params}`, signal); },
    getIngredient: (id, signal) => get<IngredientResponse>(`/ingredients/${encodeURIComponent(id)}`, signal),
  };
}
export function configure(mode = 'mock', origin = 'http://localhost:8000') {
  if (mode !== 'mock' && mode !== 'api') throw new Error('VITE_DATA_MODE must be mock or api.');
  originOnly(origin);
  return { mode, api: mode === 'mock' ? mockApi : httpApi(origin) } as const;
}
