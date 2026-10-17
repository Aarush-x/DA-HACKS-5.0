import { describe, it, expect, vi } from 'vitest';
import { mockApi, httpApi, configure, originOnly } from '../src/lib/api';
describe('fixture adapter', () => {
  it('filters both store assortments and intersects category and search', async () => {
    const all = await mockApi.getProducts({ store_id: 'demo-store-a' });
    expect(all.products).toHaveLength(6);
    const b = await mockApi.getProducts({ store_id: 'demo-store-b', category: 'bread', q: ' BREAD ' });
    expect(b.products).toHaveLength(2);
    expect(b.products.every(p => p.availability.store_id === 'demo-store-b')).toBe(true);
    expect((await mockApi.getProducts({ store_id: 'demo-store-a', category: 'bread', q: 'cereal' })).products).toEqual([]);
    const empty = await mockApi.getProducts({ store_id: 'demo-store-a', q: 'salsa' });
    expect(empty.meta.total).toBe(0); expect(empty.meta.supported_categories).toEqual(['bread', 'cereal']);
  });
  it('uses snapshot priority order, preserves missingness and does not mutate fixtures', async () => {
    const fiber = await mockApi.getProducts({ store_id: 'demo-store-a', priority: 'fiber', category: 'bread' });
    const sodium = await mockApi.getProducts({ store_id: 'demo-store-a', priority: 'sodium', category: 'bread' });
    expect(fiber.products[0].id).toBe('bread-01'); expect(sodium.products[0].id).toBe('bread-02');
    const balanced = await mockApi.getProducts({ store_id: 'demo-store-a', category: 'cereal' });
    const incomplete = balanced.products.find(p => p.id === 'cereal-03')!;
    expect(incomplete.nutrition_per_reference.added_sugar_g).toBeNull(); expect(incomplete.ranking.rank).toBeNull();
    expect((await mockApi.getProducts({ store_id: 'demo-store-a', priority: 'fiber' })).products.find(p => p.id === 'cereal-03')!.ranking.rank).toBe(3);
    fiber.products[0].name = 'mutated';
    expect((await mockApi.getProducts({ store_id: 'demo-store-a', priority: 'fiber' })).products[0].name).not.toBe('mutated');
  });
  it('supports every v2 priority using backend-generated snapshots', async () => {
    for (const priority of ['balanced', 'fiber', 'sodium', 'protein', 'low_calorie', 'low_sugar', 'low_sat_fat'] as const) {
      const result = await mockApi.getProducts({ store_id: 'demo-store-a', category: 'cereal', priority });
      expect(result.meta.priority).toBe(priority);
      expect(result.products.every(product => product.ranking.priority === priority)).toBe(true);
      expect(result.meta.fda_daily_values).toMatchObject({ calories_kcal: 2000, protein_g: 50, saturated_fat_g: 20 });
    }
    const lowSatFat = await mockApi.getProducts({ store_id: 'demo-store-a', category: 'cereal', priority: 'low_sat_fat' });
    expect(lowSatFat.products.map(product => product.id)).toEqual(['cereal-03', 'cereal-01', 'cereal-02']);
    expect(lowSatFat.products[0].retailer_search_url).toMatch(/^https:\/\/www\.walmart\.com\/search\?/);
  });
  it('reranks filtered results and removes unsupported comparative claims', async () => {
    const d = await mockApi.getProducts({ store_id: 'demo-store-a', q: 'Fiber Loaf' });
    expect(d.products[0].ranking.rank).toBe(1);
    expect(d.products[0].ranking.reasons.every(r => r.kind === 'note')).toBe(true);
  });
  it('returns actionable validation and not-found errors', async () => {
    await expect(mockApi.getProducts({ store_id: '' })).rejects.toMatchObject({ status: 422 });
    await expect(mockApi.getProducts({ store_id: 'other' })).rejects.toMatchObject({ status: 404 });
    await expect(mockApi.getProducts({ store_id: 'demo-store-a', q: 'x'.repeat(101) })).rejects.toMatchObject({ status: 422 });
    expect((await mockApi.getIngredients()).ingredients).toEqual([
      expect.objectContaining({ id: 'sample-grain', sources: [] }),
    ]);
  });
});
describe('HTTP boundary', () => {
  it('rejects unknown modes and URLs with paths, credentials or unsupported schemes', () => {
    expect(configure().mode).toBe('mock');
    for (const value of ['https://api.test/api/v1', 'https://user:pass@api.test', 'file:///tmp', 'https://api.test?q=1']) expect(() => originOnly(value)).toThrow();
    expect(() => configure('false')).toThrow();
  });
  it('encodes the query and appends the version prefix once', async () => {
    const catalog = await mockApi.getProducts({ store_id: 'demo-store-a', q: 'a & b', priority: 'fiber' });
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(catalog)));
    await httpApi('https://api.test/', fetcher).getProducts({ store_id: 'demo-store-a', q: 'a & b', priority: 'fiber' });
    expect(fetcher.mock.calls[0][0]).toBe('https://api.test/api/v1/products?store_id=demo-store-a&q=a+%26+b&priority=fiber');
  });
  it('fetches and caches the ingredient collection', async () => {
    const ingredients = await mockApi.getIngredients();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(ingredients)));
    const api = httpApi('https://api.test/', fetcher);
    await api.getIngredients();
    await api.getIngredients();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('https://api.test/api/v1/ingredients', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
  it('rejects a successful response that violates the shared shape', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ products: [] })));
    await expect(httpApi('https://api.test', fetcher).getProducts({ store_id: 'demo-store-a' })).rejects.toMatchObject({ status: 502, code: 'invalid_response' });
  });
  it('preserves server errors and never substitutes fixtures', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'unavailable', message: 'Catalog offline', request_id: 'request-1' } }), { status: 503 }));
    await expect(httpApi('https://api.test', fetcher).getProducts({ store_id: 'demo-store-a' })).rejects.toMatchObject({ status: 503, message: 'Catalog offline', requestId: 'request-1' });
  });
  it('reports timeout and forwards caller cancellation', async () => {
    const fetcher = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => { init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); }));
    await expect(httpApi('https://api.test', fetcher, 10).getStores()).rejects.toMatchObject({ status: 408 });
    const c = new AbortController(); const request = httpApi('https://api.test', fetcher).getStores(c.signal); c.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
