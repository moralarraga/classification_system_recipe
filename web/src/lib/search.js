/* Keyword search for the recipe browser: a small BM25 implementation.
 *
 * Interface used by App.jsx:
 *   const index = buildSearchIndex(recipes);
 *   const scores = searchRecipes(index, "query");  // Map(id -> score), only matches
 *
 * Each recipe becomes one document made of its title, description, ingredient
 * items and steps. The title is repeated TITLE_WEIGHT times so a title match
 * counts more. k1 and b are the usual BM25 defaults. If your IR evaluation uses
 * different settings or fields, change them here so the site matches it.
 */
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

function recipeText(r) {
  const parts = [];
  for (let i = 0; i < TITLE_WEIGHT; i++) parts.push(r.title);
  parts.push(r.description);
  for (const ing of r.ingredients || []) {
    for (let i = 0; i < INGREDIENT_WEIGHT; i++) parts.push(ing.item);
  }
  parts.push((r.steps || []).join(" "));
  return parts.join(" ");
}

export function buildSearchIndex(recipes) {
  const docs = new Map();   // id -> {tf: Map(term -> count), len}
  const df = new Map();     // term -> number of docs containing it
  let totalLen = 0;
  for (const r of recipes) {
    const tokens = tokenize(recipeText(r));
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
    docs.set(r.id, { tf, len: tokens.length });
    totalLen += tokens.length;
  }
  return { docs, df, N: recipes.length, avgLen: totalLen / Math.max(recipes.length, 1) };
}

export function searchRecipes(index, query) {
  const terms = [...new Set(tokenize(query))];
  const scores = new Map();
  if (!terms.length) return scores;
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
  }
  return scores;
}
