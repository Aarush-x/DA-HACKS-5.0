// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { mockApi, type Api } from '../src/lib/api';
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
vi.mock('@gsap/react', () => ({ useGSAP: () => ({ contextSafe: (fn: unknown) => fn }) }));
beforeAll(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);
describe('shopper flow', () => {
  it('changes ordering, compares two products and clears selection on store/category changes', async () => {
    const user = userEvent.setup(); render(<App api={mockApi} mode="mock"/>);
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
    await user.click(screen.getByRole('button', { name: 'More fiber', exact: true }));
    await waitFor(() => expect(screen.getAllByRole('article')[0].getAttribute('aria-label')).toBe('Sample Fiber Loaf'));
    await user.click(screen.getByRole('button', { name: 'Less sodium', exact: true }));
    await waitFor(() => expect(screen.getAllByRole('article')[0].getAttribute('aria-label')).toBe('Sample Gentle Loaf'));
    await user.click(screen.getAllByRole('button', { name: '+ Compare' })[0]);
    await user.click(screen.getAllByRole('button', { name: '+ Compare' })[0]);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Compare' }).hasAttribute('disabled')).toBe(true);
    await user.selectOptions(screen.getByLabelText('Demo assortment'), 'demo-store-b');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    expect(screen.queryByRole('table')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cereal', exact: true }));
    await screen.findByRole('article', { name: 'Sample Gentle Flakes' });
    expect(screen.queryByRole('article', { name: 'Sample Fiber Loaf' })).toBeNull();
  });
  it('searches cereal, handles missing values and an empty search, opens and closes ingredient notes', async () => {
    const user = userEvent.setup(); render(<App api={mockApi} mode="mock"/>);
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
    await user.type(screen.getByLabelText('What’s on your list?'), 'cereal');
    await user.click(screen.getByRole('button', { name: /Search/ }));
    const incomplete = await screen.findByRole('article', { name: 'Sample Mystery Puffs' });
    expect(within(incomplete).getByText('Not provided')).toBeTruthy();
    const trigger = screen.getAllByRole('button', { name: /Ingredient notes/ })[0];
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Sources not yet reviewed');
    await user.click(within(dialog).getByRole('button', { name: 'Close ingredient explanation' }));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(trigger);
    await user.clear(screen.getByLabelText('What’s on your list?'));
    await user.type(screen.getByLabelText('What’s on your list?'), 'salsa');
    await user.click(screen.getByRole('button', { name: /Search/ }));
    await screen.findByText('No matches on this shelf.');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await screen.findByRole('article', { name: 'Sample Mystery Puffs' });
  });
  it('shows API errors and retries without silent sample success', async () => {
    const getProducts = vi.fn().mockRejectedValueOnce(new Error('Catalog unavailable')).mockImplementation(mockApi.getProducts);
    const api = { ...mockApi, getProducts }; const user = userEvent.setup(); render(<App api={api} mode="api"/>);
    await screen.findByText('Catalog unavailable'); expect(screen.queryByRole('article')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Retry products' }));
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
  });
  it('ignores a slower stale request even if its adapter ignores abort', async () => {
    let resolveOld!: (value: Awaited<ReturnType<Api['getProducts']>>) => void;
    const old = await mockApi.getProducts({ store_id: 'demo-store-a', category: 'bread' });
    const api = { ...mockApi, getProducts: vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockImplementation(mockApi.getProducts) };
    render(<App api={api} mode="mock"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Cereal', exact: true }));
    await screen.findByRole('article', { name: 'Sample Fiber Squares' });
    resolveOld(old);
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Sample Fiber Loaf' })).toBeNull());
  });
  it('keeps unavailable ingredient explanations honest and retryable', async () => {
    const api = { ...mockApi, getIngredient: vi.fn().mockRejectedValue(new Error('Ingredient explanation unavailable. This does not imply danger.')) };
    const user = userEvent.setup(); render(<App api={api} mode="mock"/>);
    await screen.findByRole('article', { name: 'Sample Fiber Loaf' });
    await user.click(screen.getAllByRole('button', { name: /Ingredient notes/ })[0]);
    await screen.findByText('Ingredient explanation unavailable. This does not imply danger.');
    expect(screen.getByRole('button', { name: 'Retry explanation' })).toBeTruthy();
  });
});
