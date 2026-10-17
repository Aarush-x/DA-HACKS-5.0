import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Api } from './lib/api';
import { getProductIngredients, type IngredientRating } from './lib/ingredients';
import type { CatalogResponse, IngredientResponse, Nutrients, Priority, Product, StoresResponse } from './types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const priorities: [Priority, string][] = [
  ['balanced', 'Balanced'], ['fiber', 'More fiber'], ['sodium', 'Less sodium'],
  ['protein', 'High protein'], ['low_calorie', 'Low calorie'], ['low_sugar', 'Low sugar'], ['low_sat_fat', 'Low saturated fat'],
];
const metrics: [keyof Nutrients, string, string][] = [
  ['calories_kcal', 'Calories', 'kcal'], ['protein_g', 'Protein', 'g'], ['fiber_g', 'Fiber', 'g'],
  ['total_sugar_g', 'Total sugar', 'g'], ['added_sugar_g', 'Added sugar', 'g'],
  ['saturated_fat_g', 'Saturated fat', 'g'], ['sodium_mg', 'Sodium', 'mg'],
];
const nutrientGuidance: Record<keyof Nutrients, string> = {
  calories_kcal: 'Depends on your needs',
  protein_g: 'More is generally helpful',
  fiber_g: 'More is generally helpful',
  total_sugar_g: 'Lower can help; includes natural and added sugar',
  added_sugar_g: 'Less is generally preferable',
  saturated_fat_g: 'Less is generally preferable',
  sodium_mg: 'Less is generally preferable',
};
const moreIsHelpful = new Set<keyof Nutrients>(['protein_g', 'fiber_g']);
const lessIsHelpful = new Set<keyof Nutrients>(['total_sugar_g', 'added_sugar_g', 'saturated_fat_g', 'sodium_mg']);
const preferredLabels: Partial<Record<keyof Nutrients, string>> = {
  protein_g: 'More protein', fiber_g: 'Better for fiber', total_sugar_g: 'Less total sugar',
  added_sugar_g: 'Less added sugar', saturated_fat_g: 'Less saturated fat', sodium_mg: 'Less sodium',
};
const storeNames: Record<string, string> = { 'demo-store-a': 'Walmart San Jose', 'demo-store-b': 'Walmart Mountain View' };
const amount = (value: number | null, unit: string) => value === null ? 'Not provided' : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 'mg' ? 0 : 1 }).format(value)} ${unit}`;
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.';
const safeUrl = (value: string | null) => { try { const url = new URL(value ?? ''); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } };
const walmartUrl = (value: string | null) => { const url = safeUrl(value); if (!url) return undefined; const host = new URL(url).hostname; return host === 'walmart.com' || host.endsWith('.walmart.com') ? url : undefined; };

function Sources({ sources }: { sources: IngredientResponse['sources'] | Product['sources'] }) {
  if (!sources.length) return <p className="muted">Sources not yet reviewed.</p>;
  return <ul className="source-list">{sources.map(source => {
    const url = safeUrl(source.url);
    return <li key={source.id}>{url ? <a href={url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}<span>Accessed {source.accessed_at}</span></li>;
  })}</ul>;
}

function IngredientDrawer({ product, close, opener }: { product: Product; close: () => void; opener: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ingredients = useMemo(() => getProductIngredients(product.ingredients_text), [product.ingredients_text]);
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? '');
  const closing = useRef(false);
  const selectedIngredient = ingredients.find(ingredient => ingredient.id === ingredientId);
  const ratings: IngredientRating[] = ['good', 'neutral', 'limit'];

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); opener?.focus({ preventScroll: true }); };
  }, [opener]);

  const { contextSafe } = useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => { gsap.from(dialog.current, { x: 24, opacity: 0.72, duration: 0.28, clearProps: 'all', ease: 'power2.out' }); });
    return () => media.revert();
  }, { scope: dialog });
  const dismiss = contextSafe(() => {
    if (closing.current) return; closing.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) close();
    else gsap.to(dialog.current, { x: 24, opacity: 0, duration: 0.2, onComplete: close });
  });

  return <dialog ref={dialog} className="drawer" aria-labelledby="ingredient-title" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="drawer-head"><p>Ingredients</p><button className="icon-button" onClick={dismiss} aria-label="Close ingredients">×</button></div>
    <h2 id="ingredient-title">{product.name}</h2>
    {ingredients.length > 0 ? <>
      <p className="ingredient-guidance">A simple guide based on the ingredient’s usual role. Tap any ingredient to see why.</p>
      <div className="ingredient-groups">{ratings.map(rating => {
        const items = ingredients.filter(ingredient => ingredient.rating === rating);
        if (!items.length) return null;
        return <section className={`ingredient-group ${rating}`} key={rating} aria-labelledby={`rating-${rating}`}><div className="ingredient-group-heading"><h3 id={`rating-${rating}`}>{items[0].ratingLabel}</h3><span>{items.length}</span></div><div className="ingredient-tabs">{items.map(ingredient => <button className={`ingredient-chip ${rating}`} key={ingredient.id} aria-pressed={ingredientId === ingredient.id} onClick={() => setIngredientId(ingredient.id)}>{ingredient.name}</button>)}</div></section>;
      })}</div>
      {selectedIngredient && <section className="ingredient-quick-detail" aria-live="polite"><div><h3>{selectedIngredient.name}</h3><span className={`rating-badge ${selectedIngredient.rating}`}>{selectedIngredient.ratingLabel}</span></div><p>{selectedIngredient.reason}</p></section>}
    </> : <p className="empty-copy">The ingredient list was not provided for this product.</p>}
    <section className="product-sources" aria-labelledby="product-sources-title"><h3 id="product-sources-title">Product sources</h3><Sources sources={product.sources}/></section>
  </dialog>;
}

function ProductCard({ product, selected, disabled, toggle, ingredient }: { product: Product; selected: boolean; disabled: boolean; toggle: () => void; ingredient: (opener: HTMLElement) => void }) {
  const [brokenImage, setBrokenImage] = useState(false);
  const ingredientCount = getProductIngredients(product.ingredients_text).length;
  const imageUrl = safeUrl(product.image_url);
  const retailerUrl = walmartUrl(product.retailer_search_url);
  return <article className={`product-card ${selected ? 'selected' : ''}`} aria-label={product.name}>
    <div className="card-top"><span>{product.ranking.rank === null ? '—' : String(product.ranking.rank).padStart(2, '0')}</span><span>{product.category === 'bread' ? 'Bread' : 'Dry cereal'}</span></div>
    {imageUrl && !brokenImage && <figure><img src={imageUrl} alt={product.name} onError={() => setBrokenImage(true)}/>{product.image_credit && <figcaption>{product.image_credit}</figcaption>}</figure>}
    <div className="card-heading"><p className="brand">{product.brand}</p><h3>{product.name}</h3>{ingredientCount > 0 && <button className="ingredient-count-button" aria-label={`View ${ingredientCount} ingredients for ${product.name}`} onClick={event => ingredient(event.currentTarget)}>{ingredientCount} ingredients <span aria-hidden="true">→</span></button>}{product.ranking.rank === 1 && <p className="recommendation">Recommended for this priority</p>}{product.ranking.status === 'insufficient_data' && <p className="recommendation">Missing data for this priority</p>}</div>
    <div className="card-metrics"><p className="portion">Equal-weight view · per {product.reference_g} g{product.category === 'cereal' ? ' dry cereal' : ''}</p><dl className="nutrients">{metrics.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{amount(product.nutrition_per_reference[key], unit)}</dd></div>)}</dl></div>
    <div className="card-actions"><button className={selected ? 'primary' : ''} aria-pressed={selected} disabled={disabled} onClick={toggle}>{selected ? 'Selected' : 'Compare'}</button>{retailerUrl ? <a className="retailer-link" href={retailerUrl} target="_blank" rel="noreferrer" aria-label={`Search for ${product.name} on Walmart`}>Search on Walmart</a> : <span className="retailer-unavailable">Walmart search unavailable</span>}</div>
  </article>;
}

function SearchForm({ search, setSearch, store, setStore, stores, storeError, submit, retryStores, resultMode = false }: { search: string; setSearch: (value: string) => void; store: string; setStore: (value: string) => void; stores?: StoresResponse; storeError: string; submit: () => void; retryStores: () => void; resultMode?: boolean }) {
  const suffix = resultMode ? '-results' : '';
  return <div className={`search-shell ${resultMode ? 'compact' : ''}`}>
    <form onSubmit={event => { event.preventDefault(); submit(); }}><label htmlFor={`search${suffix}`}>Search the catalog</label><div className="search-field"><input id={`search${suffix}`} value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Search products" type="search" required/><button className="primary" type="submit" aria-label="Search products">Search</button></div></form>
    <div className="store-field"><label htmlFor={`store${suffix}`}>Your store</label><select id={`store${suffix}`} value={store} disabled={!stores} onChange={event => setStore(event.target.value)}>{stores ? stores.stores.map(item => <option key={item.id} value={item.id}>{storeNames[item.id] ?? item.name}</option>) : <option>Loading stores…</option>}</select></div>
    {storeError && <div className="inline-error" role="alert"><p>{storeError}</p><button onClick={retryStores}>Retry stores</button></div>}
  </div>;
}

function comparisonDetail(key: keyof Nutrients, value: number | null, other: number | null, unit: string) {
  if (value === null || other === null) return undefined;
  if (value === other) return { difference: 'Same amount', preferred: false };
  const difference = new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 'mg' ? 0 : 1 }).format(Math.abs(value - other));
  const direction = value > other ? 'more' : 'less';
  return {
    difference: `${difference} ${unit} ${direction}`,
    preferred: moreIsHelpful.has(key) ? value > other : lessIsHelpful.has(key) ? value < other : false,
  };
}

function comparisonSummary(product: Product, other: Product) {
  const advantages = metrics.flatMap(([key, label]) => {
    if (!moreIsHelpful.has(key) && !lessIsHelpful.has(key)) return [];
    const value = product.nutrition_per_reference[key];
    const otherValue = other.nutrition_per_reference[key];
    if (value === null || otherValue === null || value === otherValue) return [];
    const preferred = moreIsHelpful.has(key) ? value > otherValue : value < otherValue;
    return preferred ? [`${moreIsHelpful.has(key) ? 'more' : 'less'} ${label.toLowerCase()}`] : [];
  });
  return advantages.length ? new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' }).format(advantages) : 'No clear edge on the guidance-based rows shown';
}

export function App({ api, mode }: { api: Api; mode: 'mock' | 'api' }) {
  const root = useRef<HTMLDivElement>(null);
  const [stores, setStores] = useState<StoresResponse>();
  const [store, setStoreState] = useState('demo-store-a');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse>();
  const [error, setError] = useState('');
  const [storeError, setStoreError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryProducts, setRetryProducts] = useState(0);
  const [retryStores, setRetryStores] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [ingredientSelection, setIngredientSelection] = useState<{ product: Product }>();
  const [comparisonVisible, setComparisonVisible] = useState(false);
  const ingredientOpener = useRef<HTMLElement | null>(null);
  const comparisonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController(); setStoreError('');
    api.getStores(controller.signal).then(result => { if (!controller.signal.aborted) setStores(result); }).catch(reason => { if (!controller.signal.aborted) setStoreError(message(reason)); });
    return () => controller.abort();
  }, [api, retryStores]);

  useEffect(() => {
    if (submitted === null) return;
    const controller = new AbortController(); setLoading(true); setError('');
    api.getProducts({ store_id: store, priority, q: submitted }, controller.signal).then(result => {
      if (!controller.signal.aborted) { setCatalog(result); setSelected(ids => ids.filter(id => result.products.some(product => product.id === id))); }
    }).catch(reason => { if (!controller.signal.aborted) { setError(message(reason)); setCatalog(undefined); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, store, priority, submitted, retryProducts]);

  useGSAP(() => {
    const media = gsap.matchMedia(); media.add('(prefers-reduced-motion: no-preference)', () => { gsap.from('.hero-content > *', { y: 14, opacity: 0, duration: 0.5, stagger: 0.06, clearProps: 'all', ease: 'power2.out' }); });
    return () => media.revert();
  }, { scope: root });
  useGSAP(() => {
    if (!catalog || loading) return;
    const media = gsap.matchMedia(); media.add('(prefers-reduced-motion: no-preference)', () => { gsap.from('.results-head, .product-card', { y: 10, opacity: 0, duration: 0.36, stagger: 0.045, clearProps: 'all', ease: 'power2.out' }); });
    return () => media.revert();
  }, { scope: root, dependencies: [catalog, loading], revertOnUpdate: true });

  const compared = useMemo(() => (catalog?.products ?? []).filter(product => selected.includes(product.id)), [catalog, selected]);
  useEffect(() => {
    if (compared.length !== 2) { setComparisonVisible(false); return; }
    const element = comparisonRef.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setComparisonVisible(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [compared.length]);
  const submitSearch = () => { const query = search.trim(); if (!query) return; setSelected([]); setCatalog(undefined); setSubmitted(query); };
  const chooseStore = (next: string) => { setStoreState(next); setSelected([]); if (submitted !== null) setCatalog(undefined); };
  const resetHome = () => { setSubmitted(null); setSearch(''); setCatalog(undefined); setError(''); setSelected([]); setPriority('balanced'); };
  const toggle = (product: Product) => setSelected(ids => {
    if (ids.includes(product.id)) return ids.filter(id => id !== product.id);
    const chosen = (catalog?.products ?? []).filter(item => ids.includes(item.id));
    if (ids.length >= 2 || chosen.some(item => item.category !== product.category)) return ids;
    return [...ids, product.id];
  });
  const openIngredient = (product: Product, opener: HTMLElement) => { ingredientOpener.current = opener; setIngredientSelection({ product }); };
  const goToComparison = () => { const heading = document.getElementById('compare-title'); heading?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); heading?.focus({ preventScroll: true }); };

  return <div ref={root}>
    <a className="skip-link" href={submitted === null ? '#search' : '#search-results'}>Skip to search</a>
    <header className="site-header"><button className="wordmark" onClick={resetHome} aria-label="barelabel home">barelabel<span>.</span></button></header>
    <main>
      {submitted === null ? <section className="hero" aria-labelledby="hero-title"><div className="hero-content"><h1 id="hero-title">Know what goes<br/>in your cart.</h1><p>Find products. Compare ingredients. Choose what works for you.</p><SearchForm search={search} setSearch={setSearch} store={store} setStore={chooseStore} stores={stores} storeError={storeError} submit={submitSearch} retryStores={() => setRetryStores(value => value + 1)}/><p className="catalog-note">Currently searching a small bread and cereal catalog.</p></div></section> : <>
        <section className="results-controls" aria-label="Search controls"><SearchForm resultMode search={search} setSearch={setSearch} store={store} setStore={chooseStore} stores={stores} storeError={storeError} submit={submitSearch} retryStores={() => setRetryStores(value => value + 1)}/></section>
        <section className="results" aria-label="Products" aria-busy={loading}>
          <div className="results-head"><div><p className="kicker">Results for</p><h2>“{submitted}”</h2><p className="results-meta">{loading ? 'Finding your options…' : error ? 'Results unavailable' : `${catalog?.meta.total ?? 0} ${catalog?.meta.total === 1 ? 'option' : 'options'} at ${storeNames[store] ?? 'your store'}`}</p></div><div className="priority"><span id="priority-label">Rank by</span><div role="group" aria-labelledby="priority-label">{priorities.map(([value, label]) => <button key={value} aria-pressed={priority === value} onClick={() => { setPriority(value); setSelected([]); }}>{label}</button>)}</div></div></div>
          {loading && !catalog && <div className="loading-state" role="status"><span aria-hidden="true"></span><h3>Finding your options…</h3><p>Checking the catalog for your selected store.</p></div>}
          {error && <div className="empty-state" role="alert"><h3>We couldn’t load these results.</h3><p>{error}</p><button onClick={() => setRetryProducts(value => value + 1)}>Retry search</button></div>}
          {!loading && !error && catalog?.products.length === 0 && <div className="empty-state"><h3>No products found.</h3><p>The current catalog is limited to a small selection of bread and cereal. Try another search.</p><button onClick={() => document.getElementById('search-results')?.focus()}>Edit search</button></div>}
          <div className="product-grid" inert={loading}>{catalog?.products.map(product => { const chosen = compared[0]; const disabled = !selected.includes(product.id) && (selected.length >= 2 || Boolean(chosen && chosen.category !== product.category)); return <ProductCard key={product.id} product={product} selected={selected.includes(product.id)} disabled={disabled} toggle={() => toggle(product)} ingredient={opener => openIngredient(product, opener)}/>; })}</div>
        </section>
        {compared.length === 2 && catalog && <section ref={comparisonRef} className="comparison" aria-labelledby="compare-title"><div className="comparison-heading"><div><p className="kicker">Equal-weight comparison</p><h2 id="compare-title" tabIndex={-1}>Compare products</h2></div><button onClick={() => setSelected([])}>Clear both</button></div><p className="comparison-intro">Both products are shown at the same {compared[0].reference_g} g{compared[0].category === 'cereal' ? ' amount of dry cereal' : ' amount'}, so the numbers are directly comparable.</p><section className="comparison-summary" aria-labelledby="quick-read-title"><div className="comparison-summary-heading"><p className="kicker">Quick read</p><h3 id="quick-read-title">The clearest differences</h3></div><div className="comparison-summary-products">{compared.map((product, index) => <div key={product.id}><strong>{product.name}</strong><p>{comparisonSummary(product, compared[index === 0 ? 1 : 0])}.</p></div>)}</div><p className="comparison-summary-note">Calories are not marked better or worse because people’s needs differ.</p></section><div className="table-wrap"><table><caption className="sr-only">Plain-language nutrition comparison at equal weight</caption><thead><tr><th scope="col">Nutrient</th>{compared.map(product => <th scope="col" key={product.id}><span>{product.name}</span><button onClick={() => toggle(product)}>Remove</button></th>)}</tr></thead><tbody>{metrics.map(([key, label, unit]) => <tr key={key}><th scope="row"><span>{label}</span><small>{nutrientGuidance[key]}</small></th>{compared.map((product, index) => { const value = product.nutrition_per_reference[key]; const detail = comparisonDetail(key, value, compared[index === 0 ? 1 : 0].nutrition_per_reference[key], unit); return <td key={product.id}><strong>{amount(value, unit)}</strong>{detail && <span className="comparison-delta">{detail.difference}</span>}{detail?.preferred && <span className="comparison-preferred">{preferredLabels[key]}</span>}</td>; })}</tr>)}</tbody></table></div><div className="tradeoff-summary"><strong>Main tradeoff</strong><p>{compared.flatMap(product => product.ranking.reasons).find(reason => reason.kind === 'tradeoff')?.text ?? 'These products differ across the listed nutrients. Choose based on the priority that matters to you.'}</p></div></section>}
        <p className="ranking-note">Rankings reflect your selected priority, not a universal health rating.</p>
      </>}
    </main>
    <footer className="site-footer"><div><span className="footer-mark">barelabel.</span><details id="about-data"><summary>About the data</summary><div><p>Store availability is simulated and does not represent live Walmart inventory. Product information may be unverified or incomplete.</p><p>{mode === 'mock' ? 'This build uses fictional sample product data.' : catalog?.meta.contains_synthetic_labels ? 'This API response includes synthetic labels.' : 'This build uses the demo API.'} barelabel is not affiliated with Walmart.</p></div></details></div></footer>
    {compared.length > 0 && submitted !== null && !loading && !comparisonVisible && <aside className="selection-tray" aria-label="Selected products"><div className="tray-slots">{[0, 1].map(index => <div key={index} className={compared[index] ? 'filled' : ''}><span>{index + 1}</span>{compared[index] ? <><strong>{compared[index].name}</strong><button onClick={() => toggle(compared[index])} aria-label={`Remove ${compared[index].name}`}>×</button></> : <em>Select one more product</em>}</div>)}</div>{compared.length === 2 && <button className="primary" onClick={goToComparison}>Compare products</button>}</aside>}
    {ingredientSelection && <IngredientDrawer key={ingredientSelection.product.id} product={ingredientSelection.product} opener={ingredientOpener.current} close={() => setIngredientSelection(undefined)}/>}
  </div>;
}
