/* Pure browsing logic (no React), so it can be unit-tested with `npm test`.
 * selected: {facetId: Set(values)}. Within a facet values are OR'd (AND for
 * facets with matchAll), across facets they are AND'd.
 */
import {FACETS, crScore} from './facets.js';

export function prepare(recipes, facets = FACETS) {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const usedIn = new Map();
  for (const r of recipes) {
    for (const ing of r.ingredients || []) {
      const ref = ing.recipe_ref;
      if (!ref || !byId.has(ref)) continue;
      if (!usedIn.has(ref)) usedIn.set(ref, []);
      if (!usedIn.get(ref).includes(r)) usedIn.get(ref).push(r);
    }
  }
  for (const r of recipes) r._isSubRecipe = usedIn.has(r.id);
  const values = new Map(recipes.map((r) => [r.id, Object.fromEntries(facets.map((f) => [f.id, f.values(r)]))]));
  const all = Object.fromEntries(facets.map((f) => [f.id, new Set(recipes.flatMap((r) => values.get(r.id)[f.id]))]));
  return {recipes, byId, usedIn, values, all};
}

function matchesFacet(data, r, f, selected) {
  const sel = selected[f.id];
  if (!sel || sel.size === 0) return true;
  const vals = data.values.get(r.id)[f.id];
  return f.matchAll ? [...sel].every((s) => vals.includes(s)) : vals.some((v) => sel.has(v));
}

// Recipes matching the query and every facet except `except` (used for counts).
export function filterRecipes(data, {selected, scores, savedOnly, saved}, except = null, facets = FACETS) {
  return data.recipes.filter((r) =>
    (!scores || scores.has(r.id)) &&
    (!savedOnly || saved.has(r.id)) &&
    facets.every((f) => (f === except && !f.matchAll) || matchesFacet(data, r, f, selected)));
}

export function facetCounts(data, state, f, facets = FACETS) {
  const counts = new Map();
  for (const r of filterRecipes(data, state, f, facets)) {
    for (const v of data.values.get(r.id)[f.id]) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}

// The values to list for a facet, in display order.
export function facetValueList(data, f, counts, sel) {
  if (f.order) return f.order.filter((v) => data.all[f.id].has(v) || sel.has(v));
  const last = new Set(f.pinLast || []);
  return [...new Set([...counts.keys(), ...sel])]
    .filter((v) => (counts.get(v) || 0) > 0 || sel.has(v))
    .sort((a, b) => (last.has(a) - last.has(b)) || ((counts.get(b) || 0) - (counts.get(a) || 0)) || String(a).localeCompare(String(b)));
}

const total = (r) => (r.time && r.time.total_min != null ? r.time.total_min : null);
const byTitle = (a, b) => a.title.localeCompare(b.title);
const nullsLast = (x, y, dir) => (x === null) - (y === null) || dir * (x - y);

export const SORTS = {
  relevance: {label: 'Best match', fn: (scores) => (a, b) => scores ? scores.get(b.id) - scores.get(a.id) : a.id.localeCompare(b.id)},
  title: {label: 'Title A–Z', fn: () => byTitle},
  'time-asc': {label: 'Quickest first', fn: () => (a, b) => nullsLast(total(a), total(b), 1) || byTitle(a, b)},
  'time-desc': {label: 'Longest first', fn: () => (a, b) => nullsLast(total(a), total(b), -1) || byTitle(a, b)},
  'cr-desc': {label: 'Cultural relevance: high to low', fn: () => (a, b) => nullsLast(crScore(a), crScore(b), -1) || byTitle(a, b)},
  'cr-asc': {label: 'Cultural relevance: low to high', fn: () => (a, b) => nullsLast(crScore(a), crScore(b), 1) || byTitle(a, b)},
  id: {label: 'Recipe id', fn: () => (a, b) => a.id.localeCompare(b.id)},
};

export function sortRecipes(list, sort, scores) {
  return [...list].sort((SORTS[sort] || SORTS.relevance).fn(scores));
}

/* URL hash <-> state, so a filtered view or an open recipe can be shared. */
export function readHash(hash, facets = FACETS) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const selected = {};
  for (const f of facets) {
    const v = p.getAll(f.id);
    if (v.length) selected[f.id] = new Set(v);
  }
  return {selected, query: p.get('q') || '', sort: p.get('sort') || 'relevance', recipe: p.get('recipe'), savedOnly: p.has('saved')};
}

export function writeHash({selected, query, sort, recipe, savedOnly}, facets = FACETS) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  for (const f of facets) for (const v of selected[f.id] || []) p.append(f.id, v);
  if (savedOnly) p.set('saved', '1');
  if (sort && sort !== 'relevance') p.set('sort', sort);
  if (recipe) p.set('recipe', recipe);
  const s = p.toString();
  return s ? '#' + s : '';
}

export function formatMinutes(m) {
  if (m === null || m === undefined) return 'Time not given';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rest = m % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24), hh = h % 24;
    return `${d} day${d > 1 ? 's' : ''}${hh ? ` ${hh} hr` : ''}`;
  }
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
}
