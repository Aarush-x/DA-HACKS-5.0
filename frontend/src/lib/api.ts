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
type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNullableString = (value: unknown) => value === null || isString(value);
const isNullableNumber = (value: unknown) => value === null || typeof value === 'number';
const isNullableBoolean = (value: unknown) => value === null || typeof value === 'boolean';
const nutrientKeys = ['fiber_g', 'protein_g', 'added_sugar_g', 'total_sugar_g', 'sodium_mg', 'saturated_fat_g'] as const;
const hasNutrients = (value: unknown) => isRecord(value) && nutrientKeys.every(key => isNullableNumber(value[key]));
const hasSources = (value: unknown) => Array.isArray(value) && value.every(source => isRecord(source) && isString(source.id) && isString(source.title) && isString(source.url) && isString(source.accessed_at));
const invalidResponse = () => { throw new ApiError(502, 'The demo API returned data that does not match the shared contract.', 'invalid_response'); };
function parseStores(value: unknown): StoresResponse {
  if (!isRecord(value) || !isRecord(value.meta) || value.meta.api_version !== '1' || value.meta.inventory_mode !== 'simulated' || !Array.isArray(value.stores) || !value.stores.every(store => isRecord(store) && isString(store.id) && isString(store.name) && store.inventory_mode === 'simulated')) invalidResponse();
  return value as unknown as StoresResponse;
}
function parseCatalog(value: unknown): CatalogResponse {
  const validProduct = (product: unknown) => {
    if (!isRecord(product) || !isString(product.id) || !isString(product.name) || !isString(product.brand) || !['bread', 'cereal'].includes(String(product.category)) || !['verified', 'unverified', 'synthetic'].includes(String(product.label_status)) || !isNullableString(product.barcode) || !isNullableString(product.package_size) || !isNullableString(product.image_url) || !isNullableString(product.image_credit) || !isNullableString(product.image_source_url) || !isNullableString(product.label_verified_at) || !isNullableString(product.label_source_id) || !isNullableNumber(product.serving_g) || typeof product.reference_g !== 'number' || !hasNutrients(product.nutrition_per_serving) || !hasNutrients(product.nutrition_per_100g) || !hasNutrients(product.nutrition_per_reference) || !isNullableBoolean(product.first_grain_is_whole) || !isNullableString(product.ingredients_text) || !Array.isArray(product.ingredient_refs) || !product.ingredient_refs.every(ref => isRecord(ref) && isString(ref.id) && isString(ref.label)) || !hasSources(product.sources) || !isRecord(product.availability) || !isString(product.availability.store_id) || !['in_demo_assortment', 'out_of_demo_assortment', 'unknown'].includes(String(product.availability.status)) || product.availability.mode !== 'simulated' || !isRecord(product.ranking)) return false;
    const ranking = product.ranking;
    return ['balanced', 'fiber', 'sodium'].includes(String(ranking.priority)) && ['ranked', 'insufficient_data'].includes(String(ranking.status)) && isNullableNumber(ranking.rank) && isNullableNumber(ranking.internal_index) && Array.isArray(ranking.reasons) && ranking.reasons.every(reason => isRecord(reason) && ['strength', 'tradeoff', 'note'].includes(String(reason.kind)) && isString(reason.text)) && Array.isArray(ranking.missing_fields) && ranking.missing_fields.every(isString) && Array.isArray(ranking.components) && ranking.components.every(component => isRecord(component) && isString(component.key) && isNullableNumber(component.contribution));
  };
  if (!isRecord(value) || !isRecord(value.meta) || value.meta.api_version !== '1' || !isString(value.meta.catalog_version) || value.meta.inventory_mode !== 'simulated' || !['seed', 'postgres', 'fixture'].includes(String(value.meta.storage_mode)) || typeof value.meta.contains_synthetic_labels !== 'boolean' || !Array.isArray(value.meta.supported_categories) || !value.meta.supported_categories.every(category => ['bread', 'cereal'].includes(String(category))) || !isRecord(value.meta.reference_g_by_category) || value.meta.reference_g_by_category.bread !== 50 || value.meta.reference_g_by_category.cereal !== 40 || !['balanced', 'fiber', 'sodium'].includes(String(value.meta.priority)) || !isString(value.meta.store_id) || typeof value.meta.total !== 'number' || !Array.isArray(value.products) || !value.products.every(validProduct) || value.meta.total !== value.products.length) invalidResponse();
  return value as unknown as CatalogResponse;
}
function parseIngredient(value: unknown): IngredientResponse {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name) || !Array.isArray(value.aliases) || !value.aliases.every(isString) || !isString(value.what_it_is) || !isString(value.why_used) || !isString(value.evidence_summary) || !isString(value.practical_guidance) || !['established', 'limited', 'mixed', 'not_assessed'].includes(String(value.evidence_level)) || !isString(value.uncertainty) || !isNullableString(value.reviewed_at) || !hasSources(value.sources) || !['reviewed', 'draft', 'synthetic'].includes(String(value.content_status))) invalidResponse();
  return value as unknown as IngredientResponse;
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
  async function get<T>(path: string, parse: (value: unknown) => T, signal?: AbortSignal): Promise<T> {
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
      return parse(body);
    } catch (e) {
      if (timedOut) throw new ApiError(408, 'The request timed out after waiting. Please retry.');
      if (signal?.aborted || e instanceof ApiError) throw e;
      throw new ApiError(0, 'Could not reach the demo API. Check the connection and retry.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    getStores: signal => get('/stores', parseStores, signal),
    getProducts: (query, signal) => { const params = new URLSearchParams(); Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(key, value); }); return get(`/products?${params}`, parseCatalog, signal); },
    getIngredient: (id, signal) => get(`/ingredients/${encodeURIComponent(id)}`, parseIngredient, signal),
  };
}
export function configure(mode = 'mock', origin = 'http://localhost:8000') {
  if (mode !== 'mock' && mode !== 'api') throw new Error('VITE_DATA_MODE must be mock or api.');
  originOnly(origin);
  return { mode, api: mode === 'mock' ? mockApi : httpApi(origin) } as const;
}
