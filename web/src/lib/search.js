/* Keyword search for the recipe browser: a small BM25 implementation.
 *
 * Interface used by App.jsx:
 *   const index = buildSearchIndex(recipes);
 *   const scores = searchRecipes(index, "query");  // Map(id -> score), only matches
 *
 * Each recipe becomes one document made of every text field in the JSON: title,
 * description, ingredient lines and items, steps, cuisine tags (region/country,
 * raw and cleaned), source site and author, and the cultural relevance reasoning.
 * The title is repeated TITLE_WEIGHT times so a title match counts more. k1 and b
 * are the usual BM25 defaults. If your IR evaluation uses different settings or
 * fields, change them here so the site matches it.
 *
 * Partial words: a recipe whose text contains every query word as a substring
 * (case- and accent-insensitive, so "mex" finds "Mexico") is also returned. BM25
 * still does the ranking; substring-only matches get a tiny score so they sort
 * after the BM25 matches.
 */
import {cleanCuisine} from './facets.js';

const BM25_K1 = 1.2;
const BM25_B = 0.75;
const TITLE_WEIGHT = 3;
const INGREDIENT_WEIGHT = 2;

const STOPWORDS = new Set(("a an and are as at be by for from has in into is it its of on or that the " +
  "to with your you until then about over add cup cups tablespoon tablespoons teaspoon teaspoons " +
  "minute minutes").split(" "));

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // "jalapeño" matches "jalapeno"
    .split(/[^a-z0-9]+/)
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

// Very light stemming so "tomatoes" matches "tomato" and "onions" matches "onion".
function stem(t) {
  if (t.length > 4 && t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.length > 4 && t.endsWith("oes")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

const SUBSTRING_SCORE = 1e-6;

function fold(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Every text field of a recipe, once each (used for substring matching).
function allFields(r) {
  const c = cleanCuisine(r);
  const cr = r["cultural relevance"] || {};
  return [
    r.id, r.title, r.description,
    ...(r.ingredients || []).flatMap((i) => [i.raw, i.item, i.unit]),
    ...(r.steps || []),
    ...((r.source_tags && r.source_tags.cuisine) || []), ...c.regions, ...c.countries,
    r.source && r.source.site, r.source && r.source.author,
    cr.reasoning,
  ].filter(Boolean).join(" ");
}

// The BM25 document: all fields, with title and ingredient items weighted up.
function recipeText(r) {
  const parts = [allFields(r)];
  for (let i = 1; i < TITLE_WEIGHT; i++) parts.push(r.title);
  for (const ing of r.ingredients || []) {
    for (let i = 1; i < INGREDIENT_WEIGHT; i++) parts.push(ing.item);
  }
  return parts.join(" ");
}

export function buildSearchIndex(recipes) {
  const docs = new Map();   // id -> {tf: Map(term -> count), len, text}
  const df = new Map();     // term -> number of docs containing it
  let totalLen = 0;
  for (const r of recipes) {
    const tokens = tokenize(recipeText(r));
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
    docs.set(r.id, { tf, len: tokens.length, text: fold(allFields(r)) });
    totalLen += tokens.length;
  }
  return { docs, df, N: recipes.length, avgLen: totalLen / Math.max(recipes.length, 1) };
}

export function searchRecipes(index, query) {
  const terms = [...new Set(tokenize(query))];
  const words = fold(query).split(/\s+/).filter(Boolean);
  const scores = new Map();
  if (!terms.length && !words.length) return scores;
  for (const [id, doc] of index.docs) {
    let score = 0;
    for (const t of terms) {
      const f = doc.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t);
      const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5));
      score += idf * (f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + BM25_B * doc.len / index.avgLen));
    }
    if (score > 0) scores.set(id, score);
    else if (words.length && words.every((w) => doc.text.includes(w))) scores.set(id, SUBSTRING_SCORE);
  }
  return scores;
}
