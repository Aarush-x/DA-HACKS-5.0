import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Api } from './lib/api';
import type { CatalogResponse, Category, IngredientResponse, Nutrients, Priority, Product, StoresResponse } from './types';
gsap.registerPlugin(useGSAP, ScrollTrigger);
const priorities: [Priority, string][] = [['balanced', 'Balanced'], ['fiber', 'More fiber'], ['sodium', 'Less sodium']];
const metrics: [keyof Nutrients, string, string][] = [['fiber_g', 'Fiber', 'g'], ['protein_g', 'Protein', 'g'], ['added_sugar_g', 'Added sugar', 'g'], ['total_sugar_g', 'Total sugar', 'g'], ['sodium_mg', 'Sodium', 'mg'], ['saturated_fat_g', 'Saturated fat', 'g']];
export const amount = (value: number | null, unit: string) => value === null ? 'Not provided' : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
const message = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong. Please retry.';
const safeUrl = (value: string | null) => { try { const u = new URL(value ?? ''); return ['http:', 'https:'].includes(u.protocol) ? u.href : undefined; } catch { return undefined; } };
function Sources({ sources }: { sources: IngredientResponse['sources'] }) {
  return sources.length ? <ul>{sources.map(s => <li key={s.id}><a href={safeUrl(s.url)} target="_blank" rel="noreferrer">{s.title}</a> · accessed {s.accessed_at}</li>)}</ul> : <p>Sources not yet reviewed</p>;
}
function IngredientDrawer({ id, api, close, opener }: { id: string; api: Api; close: () => void; opener: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<IngredientResponse>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const closing = useRef(false);
  useEffect(() => {
    const returnTo = opener;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); returnTo?.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setData(undefined); setError('');
    api.getIngredient(id, controller.signal).then(d => { if (!controller.signal.aborted) setData(d); }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [id, api, retry]);
  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => { gsap.from(dialog.current, { x: 24, opacity: 0.7, duration: 0.28, clearProps: 'all', ease: 'power2.out' }); });
    return () => mm.revert();
  }, { scope: dialog });
  const dismiss = contextSafe(() => {
    if (closing.current) return; closing.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) close();
    else gsap.to(dialog.current, { x: 24, opacity: 0, duration: 0.24, onComplete: close });
  });
  return <dialog ref={dialog} className="drawer" aria-labelledby="ingredient-title" onCancel={e => { e.preventDefault(); dismiss(); }} onClick={e => { if (e.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dismiss(); } }}>
    <div className="drawer-head"><span className="eyebrow">The ingredient notes</span><button onClick={dismiss} aria-label="Close ingredient explanation">Close ×</button></div>
    <h2 id="ingredient-title">{data?.name ?? 'Ingredient explanation'}</h2>
    {!data && !error && <p role="status">Loading explanation…</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(n => n + 1)}>Retry explanation</button></div>}
    {data && <><p className="notice">{data.content_status === 'synthetic' ? 'Sample ingredient content' : `${data.content_status} content`} · evidence: {data.evidence_level.replaceAll('_', ' ')}</p>{[['What it is', data.what_it_is], ['Why it is used', data.why_used], ['What the evidence says', data.evidence_summary], ['In practice', data.practical_guidance], ['What remains uncertain', data.uncertainty]].map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}<h3>References</h3><Sources sources={data.sources}/><p className="muted">Reviewed: {data.reviewed_at ?? 'Not yet reviewed'}</p></>}
  </dialog>;
}
function ProductCard({ product: p, selected, disabled, toggle, ingredient }: { product: Product; selected: boolean; disabled: boolean; toggle: () => void; ingredient: (id: string, opener: HTMLElement) => void }) {
  const [broken, setBroken] = useState(false);
  return <article className={`product-card ${selected ? 'selected' : ''}`} aria-label={p.name}>
    <div className="card-top"><span>{p.ranking.rank === null ? 'Unranked' : `0${p.ranking.rank}`}</span><span>{p.label_status === 'synthetic' ? 'Sample label' : p.label_status === 'verified' ? 'Verified label' : 'Unverified label'}</span></div>
    {safeUrl(p.image_url) && !broken ? <figure><img src={safeUrl(p.image_url)} alt={p.name} onError={() => setBroken(true)}/>{p.image_credit && <figcaption>{p.image_credit}</figcaption>}{safeUrl(p.image_source_url) && <a href={safeUrl(p.image_source_url)} target="_blank" rel="noreferrer">Image source</a>}</figure> : <div className="image-note">{p.category === 'bread' ? 'BREAD' : 'DRY CEREAL'} <span>Image not provided</span></div>}
    <p className="brand">{p.brand}</p><h3>{p.name}</h3>
    <p className="recommendation">{p.ranking.rank === 1 ? 'Recommended for your selected priority' : p.ranking.status === 'insufficient_data' ? 'Not enough data for this priority' : 'Another option to consider'}</p>
    <p className="portion">At equal weight · per {p.reference_g} g{p.category === 'cereal' ? ' dry cereal' : ''}</p>
    <dl className="nutrients">{metrics.filter(([k]) => ['fiber_g', 'added_sugar_g', 'sodium_mg'].includes(k)).map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{amount(p.nutrition_per_reference[key], unit)}</dd></div>)}</dl>
    <div className="reasons">{p.ranking.reasons.map((r, i) => <p key={i} className={r.kind}>{r.kind === 'tradeoff' ? 'Tradeoff: ' : ''}{r.text}</p>)}</div>
    {p.ranking.missing_fields.length > 0 && <p className="muted">Missing: {p.ranking.missing_fields.map(k => k.replaceAll('_', ' ')).join(', ')}</p>}
    <div className="card-actions"><button className={selected ? 'primary' : ''} aria-pressed={selected} disabled={disabled} onClick={toggle}>{selected ? '✓ Selected' : '+ Compare'}</button>{p.ingredient_refs.map(ref => <button className="text-button" key={ref.id} onClick={event => ingredient(ref.id, event.currentTarget)}>Ingredient notes ↗<span className="sr-only">: {ref.label} in {p.name}</span></button>)}</div>
    {!p.ingredient_refs.length && <p className="muted">Ingredient explanations unavailable</p>}
  </article>;
}
export function App({ api, mode }: { api: Api; mode: 'mock' | 'api' }) {
  const root = useRef<HTMLDivElement>(null);
  const [stores, setStores] = useState<StoresResponse>();
  const [store, setStore] = useState('demo-store-a');
  const [category, setCategory] = useState<Category>('bread');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [search, setSearch] = useState(''); const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<CatalogResponse>();
  const [error, setError] = useState(''); const [storeError, setStoreError] = useState('');
  const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [ingredientId, setIngredientId] = useState<string>();
  const ingredientOpener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const c = new AbortController(); setStoreError('');
    api.getStores(c.signal).then(d => { if (!c.signal.aborted) setStores(d); }).catch(e => { if (!c.signal.aborted) setStoreError(message(e)); });
    return () => c.abort();
  }, [api, retry]);
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setError(''); setCatalog(undefined);
    api.getProducts({ store_id: store, category, priority, q: query }, c.signal).then(d => {
      if (!c.signal.aborted) { setCatalog(d); setSelected(ids => ids.filter(id => d.products.some(p => p.id === id))); }
    }).catch(e => { if (!c.signal.aborted) setError(message(e)); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [api, store, category, priority, query, retry]);
  useGSAP(() => {
    const mm = gsap.matchMedia(); mm.add('(prefers-reduced-motion: no-preference)', () => { gsap.from('.intro', { y: 12, opacity: 0.7, duration: 0.5, clearProps: 'all' }); });
    return () => mm.revert();
  }, { scope: root });
  useGSAP(() => {
    if (!catalog) return;
    const mm = gsap.matchMedia(); mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.results-summary', { y: 2, opacity: 0.8, duration: 0.18, clearProps: 'all' });
      gsap.utils.toArray<HTMLElement>('.product-card', root.current).forEach((card, i) => {
        gsap.from(card, { y: 10, opacity: 0.85, duration: 0.45, delay: (i % 3) * 0.04, clearProps: 'all', scrollTrigger: { trigger: card, start: 'top 95%', once: true } });
      });
    }); return () => mm.revert();
  }, { scope: root, dependencies: [catalog], revertOnUpdate: true });
  const compared = (catalog?.products ?? []).filter(p => selected.includes(p.id));
  const toggle = (p: Product) => setSelected(ids => ids.includes(p.id) ? ids.filter(id => id !== p.id) : ids.length < 2 ? [...ids, p.id] : ids);
  const chooseCategory = (next: Category) => { setCategory(next); setSelected([]); setSearch(''); setQuery(''); };
  return <div ref={root}>
    <a className="skip-link" href="#search">Skip to search</a>
    <header className="site-header"><a className="wordmark" href="#">shelf<span>sense</span><span className="wordmark-dot">.</span></a><span className="edition">THE EVERYDAY GROCERY EDIT / 01</span></header>
    <div className="disclosure"><span>{mode === 'mock' || catalog?.meta.contains_synthetic_labels ? 'Sample product data' : 'Product label status shown on each card'}</span><span>Store availability is simulated</span>{mode === 'api' && <span>{catalog && !error ? 'Connected to demo API' : 'Demo API mode'}</span>}</div>
    <main><section className="intro"><div><p className="eyebrow">A little clarity for your cart</p><h1>Same shelf.<br/><em>A clearer choice.</em></h1></div><p className="intro-note">Compare what matters, at the same weight.<br/>See the tradeoff. Choose for yourself.</p></section>
    <section className="search-panel" aria-label="Find groceries"><div className="search-row"><form onSubmit={e => { e.preventDefault(); const q = search.trim(); if (q.toLowerCase() === 'bread' || q.toLowerCase() === 'cereal') { setCategory(q.toLowerCase() as Category); setSelected([]); } setQuery(q); }}><label htmlFor="search">What’s on your list?</label><div className="search-field"><input id="search" value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Search bread or cereal" type="search"/><button className="primary" type="submit">Search <span aria-hidden="true">↗</span></button></div></form><div className="store-field"><label htmlFor="store">Demo assortment</label><select id="store" value={store} disabled={!stores} onChange={e => { setStore(e.target.value); setSelected([]); }}>{stores ? stores.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option>Loading stores…</option>}</select></div></div>
    {storeError && <div role="alert"><p>{storeError}</p><button onClick={() => setRetry(n => n + 1)}>Retry stores</button></div>}
    <div className="filter-row"><div className="categories" aria-label="Category">{(['bread', 'cereal'] as const).map(c => <button key={c} aria-pressed={category === c} onClick={() => chooseCategory(c)}>{c === 'bread' ? 'Bread' : 'Cereal'}</button>)}</div><div className="priority"><span id="priority-label">Your priority</span><div role="group" aria-labelledby="priority-label">{priorities.map(([value, label]) => <button key={value} aria-pressed={priority === value} onClick={() => setPriority(value)}>{label}</button>)}</div></div></div></section>
    <section className="results" aria-label="Products" aria-busy={loading}><div className="results-summary"><div><p className="eyebrow">The comparison shelf</p><h2>{category === 'bread' ? 'Bread, considered.' : 'Cereal, considered.'}</h2></div><p role="status">{loading ? 'Finding your options…' : error ? 'Results unavailable' : `${catalog?.meta.total ?? 0} options · per ${category === 'bread' ? '50 g' : '40 g dry cereal'}`}</p></div>
    <p className="muted comparison-help">Select two products to compare. {selected.length}/2 selected. {selected.length === 2 ? 'Deselect one to choose another.' : 'Rankings reflect your selected priority, not a universal health rating.'}</p>
    {loading && <div className="loading-state">Loading the assortment…</div>}
    {error && <div className="empty-state" role="alert"><h3>We couldn’t load the shelf.</h3><p>{error}</p><button onClick={() => setRetry(n => n + 1)}>Retry products</button></div>}
    {!loading && !error && catalog?.products.length === 0 && <div className="empty-state"><h3>No matches on this shelf.</h3><p>Try bread or cereal. The demo includes only these two categories.</p><button onClick={() => { setSearch(''); setQuery(''); }}>Clear search</button></div>}
    <div className="product-grid">{catalog?.products.map(p => <ProductCard key={p.id} product={p} selected={selected.includes(p.id)} disabled={!selected.includes(p.id) && selected.length >= 2} toggle={() => toggle(p)} ingredient={(id, opener) => { ingredientOpener.current = opener; setIngredientId(id); }}/>)}</div></section>
    {compared.length > 0 && <section className="comparison" aria-labelledby="compare-title"><div className="section-heading"><div><p className="eyebrow">Look a little closer</p><h2 id="compare-title">Side by side.</h2></div><button onClick={() => setSelected([])}>Clear comparison</button></div>{compared.length < 2 ? <p>Select one more product from this category.</p> : <><p>Equal amounts: per {compared[0].reference_g} g{category === 'cereal' ? ' dry cereal, without milk' : ''}. These are comparison portions, not recommended servings.</p><div className="table-wrap"><table><caption className="sr-only">Nutrition at equal weight</caption><thead><tr><th scope="col">Nutrient</th>{compared.map(p => <th scope="col" key={p.id}>{p.name}</th>)}</tr></thead><tbody>{metrics.map(([key, label, unit]) => <tr key={key}><th scope="row">{label}</th>{compared.map(p => <td key={p.id}>{amount(p.nutrition_per_reference[key], unit)}</td>)}</tr>)}</tbody></table></div>{compared.map(p => <div key={p.id} className="comparison-source"><h3>{p.name}</h3><p>{p.ingredients_text ?? 'Ingredients not provided'}</p><Sources sources={p.sources}/></div>)}</>}</section>}
    <footer><span className="wordmark">shelfsense.</span><p>A small demo for more informed choices.<br/>Fictional sample labels in mock mode. No affiliation with Walmart.</p><span>DA HACKS 5.0</span></footer></main>
    {ingredientId && <IngredientDrawer key={ingredientId} id={ingredientId} api={api} opener={ingredientOpener.current} close={() => setIngredientId(undefined)}/>}
  </div>;
}
