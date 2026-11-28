import {useEffect, useMemo, useState} from 'react';
import {AnimatePresence, MotionConfig} from 'framer-motion';
import {FACETS} from './lib/facets.js';
import {buildSearchIndex, searchRecipes} from './lib/search.js';
import {prepare, filterRecipes, sortRecipes, readHash, writeHash, SORTS, defaultSort} from './lib/browse.js';
import {supabase} from './lib/supabase.js';
import {local, loadRemote, saveRemote} from './lib/saved.js';
import FacetPanel from './components/FacetPanel.jsx';
import RecipeCard from './components/RecipeCard.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import Account from './components/Account.jsx';

const PAGE = 30;
const initial = readHash(location.hash);

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(initial.selected);
  const [query, setQuery] = useState(initial.query);
  const [draft, setDraft] = useState(initial.query);
  const [sort, setSort] = useState(initial.sort);
  const [openId, setOpenId] = useState(initial.recipe);
  const [savedOnly, setSavedOnly] = useState(initial.savedOnly);
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saved, setSaved] = useState(local.get);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/recipes.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((recipes) => setData({...prepare(recipes), index: buildSearchIndex(recipes)}))
      .catch((e) => setError(`Could not load recipes.json (${e.message}).`));
  }, []);

  // Accounts (optional): same pattern as the FE project.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user ?? null));
    const {data: s} = supabase.auth.onAuthStateChange((_e, ses) => setUser(ses?.user ?? null));
    return () => s.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (user) loadRemote(user).then((s) => setSaved(new Set([...s, ...local.get()]))).catch(() => {}); }, [user]);
  useEffect(() => local.set(saved), [saved]);

  const toggleSaved = (id) => {
    const on = !saved.has(id);
    setSaved((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
    if (user) saveRemote(user, id, on).catch(() => {});
  };

  // Keep the URL in sync, and follow pasted links / Back.
  useEffect(() => {
    const h = writeHash({selected, query, sort, recipe: openId, savedOnly});
    if (h !== location.hash) history.replaceState(null, '', h || location.pathname);
  }, [selected, query, sort, openId, savedOnly]);
  useEffect(() => {
    const onHash = () => {
      const s = readHash(location.hash);
      setSelected(s.selected); setQuery(s.query); setDraft(s.query); setSort(s.sort); setOpenId(s.recipe); setSavedOnly(s.savedOnly);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { setOpenId(null); setFiltersOpen(false); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, []);

  // Searching switches the default sort to best match, clearing it switches back to ID.
  const setSearch = (q) => {
    setQuery(q);
    setSort((s) => (s === defaultSort(query) ? defaultSort(q) : s));
  };

  const scores = useMemo(() => (data && query ? searchRecipes(data.index, query) : null), [data, query]);
  const state = {selected, scores, savedOnly, saved};
  const results = useMemo(() => (data ? sortRecipes(filterRecipes(data, state), sort, scores) : []),
    [data, selected, scores, savedOnly, saved, sort]);

  const reset = () => setShown(PAGE);
  const toggle = (facetId, value) => {
    setSelected((s) => {
      const n = {...s}, set = new Set(n[facetId] || []);
      set.has(value) ? set.delete(value) : set.add(value);
      if (set.size) n[facetId] = set; else delete n[facetId];
      return n;
    });
    reset();
  };
  const clearAll = () => { setSelected({}); setSearch(''); setDraft(''); setSavedOnly(false); reset(); };

  const chips = [];
  if (query) chips.push({key: 'q', label: `Search: “${query}”`, remove: () => { setSearch(''); setDraft(''); }});
  if (savedOnly) chips.push({key: 'saved', label: 'Saved only', remove: () => setSavedOnly(false)});
  for (const f of FACETS) for (const v of selected[f.id] || []) {
    chips.push({key: f.id + v, facet: f.label, label: f.display ? f.display(v) : v, remove: () => toggle(f.id, v)});
  }

  const open = data && openId ? data.byId.get(openId) : null;

  return (
    <MotionConfig reducedMotion="user">
      <header className="site-header">
        <button type="button" className="menu-btn" aria-controls="facets" aria-expanded={filtersOpen}
          aria-label={filtersOpen ? 'Close filters' : 'Open filters'} onClick={() => setFiltersOpen((o) => !o)}>
          <span className="menu-icon" aria-hidden="true"><i /><i /><i /></span>
        </button>
        <div className="brand">
          <h1>Recipe Browser</h1>
          <p className="tagline">A faceted collection of {data ? data.recipes.length : '…'} recipes</p>
        </div>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); setSearch(draft.trim()); reset(); }}>
          <label htmlFor="q" className="sr-only">Search recipes</label>
          <input id="q" type="search" value={draft} placeholder="Search titles, ingredients, steps…" autoComplete="off"
            onChange={(e) => { setDraft(e.target.value); if (!e.target.value) setSearch(''); }} />
          <button type="submit" className="primary">Search</button>
        </form>
        <Account user={user} savedCount={saved.size} />
      </header>

      <div className={'layout' + (filtersOpen ? ' filters-open' : '')}>
        {filtersOpen && <div className="filters-backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" />}
        <aside className="facets" id="facets" aria-label="Filters">
          <div className="facets-head">
            <h2>Filters</h2>
            <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>
            <button type="button" className="close-filters" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>×</button>
          </div>
          <label className="saved-toggle">
            <input type="checkbox" checked={savedOnly} onChange={(e) => { setSavedOnly(e.target.checked); reset(); }} />
            <span>Saved recipes only</span><span className="v-count">{saved.size}</span>
          </label>
          {data && <FacetPanel data={data} state={state} onToggle={toggle} />}
        </aside>

        <main className="results">
          <div className="results-bar">
            <p className="result-count" aria-live="polite">
              {error || (data ? `${results.length} recipe${results.length === 1 ? '' : 's'}${results.length === data.recipes.length ? '' : ` of ${data.recipes.length}`}` : 'Loading…')}
            </p>
            <label className="sort">Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).filter(([k]) => k !== 'relevance' || query).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map((c) => (
                <button key={c.key} type="button" className="chip" onClick={c.remove} aria-label={`Remove ${c.facet ? c.facet + ': ' : ''}${c.label}`}>
                  {c.facet && <span className="chip-facet">{c.facet}: </span>}{c.label}<span aria-hidden="true"> ×</span>
                </button>
              ))}
            </div>
          )}

          <ol className="cards">
            {results.slice(0, shown).map((r) => (
              <RecipeCard key={r.id} recipe={r} saved={saved.has(r.id)} onOpen={() => setOpenId(r.id)} onSave={() => toggleSaved(r.id)} />
            ))}
          </ol>
          {data && results.length === 0 && <p className="empty-state">No recipes match. Try removing a filter.</p>}
          {results.length > shown && (
            <button type="button" className="primary more-btn" onClick={() => setShown((n) => n + PAGE)}>
              Show more recipes ({results.length - shown} left)
            </button>
          )}
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <RecipeDetail key="detail" recipe={open} data={data} saved={saved.has(open.id)}
            onSave={() => toggleSaved(open.id)} onOpen={setOpenId} onClose={() => setOpenId(null)} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
