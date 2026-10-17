// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { mockApi, type Api } from '../src/lib/api';

vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
vi.mock('@gsap/react', () => ({ useGSAP: () => ({ contextSafe: (fn: unknown) => fn }) }));

beforeAll(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);

async function searchFor(term: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Search the catalog'), term);
  await user.click(screen.getByRole('button', { name: 'Search products' }));
  return user;
}

describe('search-first shopper flow', () => {
  it('starts idle, maps store names, and requests products only after search', async () => {
    const api = { ...mockApi, getProducts: vi.fn(mockApi.getProducts) };
    render(<App api={api} mode="mock"/>);
    expect(screen.getByRole('heading', { name: 'Know what goes in your cart.' })).toBeTruthy();
    expect(screen.queryByRole('article')).toBeNull();
    expect(api.getProducts).not.toHaveBeenCalled();
    expect(await screen.findByRole('option', { name: 'Walmart San Jose' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Walmart Mountain View' })).toBeTruthy();
    await searchFor('bread');
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
    expect(api.getProducts).toHaveBeenCalledWith(expect.objectContaining({ store_id: 'demo-store-a', q: 'bread', priority: 'balanced' }), expect.any(AbortSignal));
    expect(screen.getByRole('group', { name: 'Rank by' })).toBeTruthy();
  });

  it('keeps the submitted search visible and reruns it when the store changes', async () => {
    const user = userEvent.setup();
    const api = { ...mockApi, getProducts: vi.fn(mockApi.getProducts) };
    render(<App api={api} mode="mock"/>);
    await user.type(screen.getByLabelText('Search the catalog'), 'bread');
    await user.keyboard('{Enter}');
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
    await user.click(screen.getAllByRole('button', { name: 'Compare' })[0]);
    expect(screen.getByRole('complementary', { name: 'Selected products' })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Your store'), 'demo-store-b');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    expect(screen.queryByRole('complementary', { name: 'Selected products' })).toBeNull();
    expect(screen.getByDisplayValue('bread')).toBeTruthy();
    expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ store_id: 'demo-store-b', q: 'bread' }), expect.any(AbortSignal));
  });

  it('shows an honest empty state and returns home from the wordmark', async () => {
    const user = await searchForAfterRender('salsa');
    await screen.findByRole('heading', { name: 'No products found.' });
    await user.click(screen.getByRole('button', { name: 'barelabel home' }));
    expect(screen.getByRole('heading', { name: 'Know what goes in your cart.' })).toBeTruthy();
    expect(screen.queryByText('No products found.')).toBeNull();
  });

  it('shows API failures and retries without falling back to sample results', async () => {
    const getProducts = vi.fn().mockRejectedValueOnce(new Error('Catalog unavailable')).mockImplementation(mockApi.getProducts);
    render(<App api={{ ...mockApi, getProducts }} mode="api"/>);
    const user = await searchFor('bread');
    await screen.findByText('Catalog unavailable');
    expect(screen.queryByRole('article')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Retry search' }));
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
  });

  it('opens ingredients and product sources in the evidence drawer', async () => {
    const api = {
      ...mockApi,
      async getProducts(query: Parameters<Api['getProducts']>[0], signal?: AbortSignal) {
        const response = await mockApi.getProducts(query, signal);
        response.products[0].ingredients_text = 'Whole grain oats, water, sugar, salt. Contains wheat.';
        response.products[0].sources = [{ id: 'product-label', title: 'Sample product label', url: 'https://example.com/product-label', accessed_at: '2026-10-16' }];
        return response;
      },
    };
    render(<App api={api} mode="mock"/>);
    const user = await searchFor('bread');
    const cards = await screen.findAllByRole('article');
    const firstCard = cards[0];
    for (const label of ['Calories', 'Protein', 'Fiber', 'Total sugar', 'Added sugar', 'Saturated fat', 'Sodium']) {
      expect(within(firstCard).getByText(label)).toBeTruthy();
    }
    expect(within(firstCard).queryByText(/More fiber at equal weight/)).toBeNull();
    expect(within(firstCard).queryByText(/Tradeoff:/)).toBeNull();
    expect(within(firstCard).queryByText('Ingredients and sources')).toBeNull();
    const trigger = within(firstCard).getByRole('button', { name: 'View 4 ingredients for Sample Fiber Loaf' });
    await user.click(trigger);
    const walmart = within(firstCard).getByRole('link', { name: /Search for Sample Fiber Loaf on Walmart/ });
    expect(walmart.getAttribute('href')).toMatch(/^https:\/\/www\.walmart\.com\/search\?/);
    expect(walmart.getAttribute('target')).toBe('_blank');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Sample Fiber Loaf' })).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'Product sources' })).toBeTruthy();
    const productSource = within(dialog).getByRole('link', { name: 'Sample product label' });
    expect(productSource.getAttribute('href')).toBe('https://example.com/product-label');
    for (const category of ['Good choice', 'Neutral', 'Limit']) expect(within(dialog).getAllByText(category).length).toBeGreaterThan(0);
    for (const ingredient of ['Whole grain oats', 'water', 'sugar', 'salt']) expect(within(dialog).getByRole('button', { name: ingredient })).toBeTruthy();
    expect(within(dialog).queryByText('wheat')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'sugar' }));
    expect(within(dialog).getByText(/Adds sweetness or added sugar/)).toBeTruthy();
    expect(within(dialog).queryByText('Potential benefits and tradeoffs')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Close ingredients' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('builds a two-slot tray and a single aligned comparison table', async () => {
    const user = await searchForAfterRender('bread');
    const cards = await screen.findAllByRole('article');
    await user.click(within(cards[0]).getByRole('button', { name: 'Compare' }));
    const tray = screen.getByRole('complementary', { name: 'Selected products' });
    expect(within(tray).getByText('Select one more product')).toBeTruthy();
    await user.click(within(cards[1]).getByRole('button', { name: 'Compare' }));
    expect(within(tray).getByRole('button', { name: 'Compare products' })).toBeTruthy();
    const comparison = screen.getByRole('heading', { name: 'Compare products' }).closest('section')!;
    expect(within(comparison).getByText(/same 50 g amount, so the numbers are directly comparable/)).toBeTruthy();
    expect(within(comparison).getByRole('heading', { name: 'The clearest differences' })).toBeTruthy();
    expect(within(comparison).getByText(/more protein, more fiber, less total sugar, and less added sugar/i)).toBeTruthy();
    expect(within(comparison).getByText(/^less sodium\.$/i)).toBeTruthy();
    const table = screen.getByRole('table', { name: 'Plain-language nutrition comparison at equal weight' });
    expect(within(table).getByRole('rowheader', { name: /^Calories Depends on your needs$/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Protein More is generally helpful$/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Fiber More is generally helpful$/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Total sugar Lower can help/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Added sugar Less is generally preferable$/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Saturated fat Less is generally preferable$/ })).toBeTruthy();
    expect(within(table).getByRole('rowheader', { name: /^Sodium Less is generally preferable$/ })).toBeTruthy();
    expect(within(table).getAllByText('More is generally helpful')).toHaveLength(2);
    expect(within(table).getAllByText('Less is generally preferable')).toHaveLength(3);
    expect(within(table).getByText('Lower can help; includes natural and added sugar')).toBeTruthy();
    expect(within(table).getByText('3 g more')).toBeTruthy();
    expect(within(table).getByText('Better for fiber')).toBeTruthy();
    expect(within(table).getByText('Less sodium')).toBeTruthy();
    expect(within(table).queryByText(/% DV|Daily Value/)).toBeNull();
    expect(within(table).getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
  });

  it('requests every v2 ranking priority and renders the returned order', async () => {
    const user = userEvent.setup();
    const api = { ...mockApi, getProducts: vi.fn(mockApi.getProducts) };
    render(<App api={api} mode="mock"/>);
    await user.type(screen.getByLabelText('Search the catalog'), 'cereal');
    await user.keyboard('{Enter}');
    await screen.findByRole('article', { name: 'Sample Fiber Squares' });
    for (const [label, priority] of [
      ['High protein', 'protein'], ['Low calorie', 'low_calorie'], ['Low sugar', 'low_sugar'], ['Low saturated fat', 'low_sat_fat'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }));
      await waitFor(() => expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ priority }), expect.any(AbortSignal)));
    }
    await waitFor(() => expect(screen.getAllByRole('article')[0].getAttribute('aria-label')).toBe('Sample Mystery Puffs'));
  });

  it('ignores a stale search even if an adapter ignores abort', async () => {
    let resolveOld!: (value: Awaited<ReturnType<Api['getProducts']>>) => void;
    const oldBread = await mockApi.getProducts({ store_id: 'demo-store-a', q: 'bread' });
    const api = { ...mockApi, getProducts: vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockImplementation(mockApi.getProducts) };
    render(<App api={api} mode="mock"/>);
    const user = await searchFor('bread');
    const input = screen.getByLabelText('Search the catalog');
    await user.clear(input); await user.type(input, 'cereal'); await user.keyboard('{Enter}');
    await screen.findByRole('article', { name: 'Sample Fiber Squares' });
    resolveOld(oldBread);
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Sample Fiber Loaf' })).toBeNull());
  });
});

async function searchForAfterRender(term: string) {
  render(<App api={mockApi} mode="mock"/>);
  return searchFor(term);
}
