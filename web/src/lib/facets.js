/* Facet definitions for the recipe browser.
 *
 * Each facet has:
 *   id      - key used in the URL and in the filter state
 *   label   - heading shown in the sidebar
 *   values  - function(recipe) returning an array of facet values for that recipe
 *   order   - optional fixed order of values (otherwise sorted by count)
 *   display - optional function(value) returning the label shown for a value
 *   collapsedLimit - how many values to show before "Show more"
 *
 * Within one facet, checked values are OR'd. Across facets they are AND'd.
 * To add or change a facet, edit the FACETS array at the bottom.
 */


/* ---------- Cleaning the cuisine tags ----------
 * source_tags.cuisine is usually [region, country]. The raw tags mix spellings
 * ("USA", "United States", "America"; "Asia", "Asian"), so they are normalized
 * here for display only. recipes.json itself is not changed.
 */
const REGION_ALIASES = {
  "americas": "Americas", "america (region)": "Americas",
  "europe": "Europe", "european": "Europe",
  "asia": "Asia", "asian": "Asia", "south asian": "Asia",
  "africa": "Africa", "african": "Africa", "north african": "Africa",
  "oceania": "Oceania",
  "middle east": "Middle East",
};

const COUNTRY_ALIASES = {
  "usa": "USA", "united states": "USA", "america": "USA",
  "mexican": "Mexico", "korean": "Korea", "thai": "Thailand",
  "indian": "India", "turkey": "Türkiye", "turkiye": "Türkiye",
};

// Region to use when a recipe has a country tag but no region tag.
const COUNTRY_REGION = {
  "USA": "Americas", "Mexico": "Americas", "Canada": "Americas", "Brazil": "Americas",
  "Peru": "Americas", "Venezuela": "Americas", "Cuba": "Americas", "Argentina": "Americas", "Chile": "Americas",
  "Italy": "Europe", "France": "Europe", "England": "Europe", "Scotland": "Europe", "Germany": "Europe",
  "Switzerland": "Europe", "Poland": "Europe", "Spain": "Europe", "Austria": "Europe", "Greece": "Europe",
  "Sweden": "Europe", "Belgium": "Europe", "Netherlands": "Europe",
  "Japan": "Asia", "China": "Asia", "India": "Asia", "Thailand": "Asia", "Vietnam": "Asia", "Korea": "Asia",
  "Philippines": "Asia", "Singapore": "Asia", "Türkiye": "Asia",
  "Nigeria": "Africa", "Tunisia": "Africa", "Egypt": "Africa", "Yemen": "Middle East",
};

export function cleanCuisine(recipe) {
  const tags = (recipe.source_tags && recipe.source_tags.cuisine) || [];
  const regions = new Set();
  const countries = new Set();
  for (const raw of tags) {
    if (!raw) continue;
    const key = String(raw).trim().toLowerCase();
    if (REGION_ALIASES[key]) { regions.add(REGION_ALIASES[key]); continue; }
    countries.add(COUNTRY_ALIASES[key] || String(raw).trim());
  }
  for (const c of countries) {
    if (regions.size === 0 && COUNTRY_REGION[c]) regions.add(COUNTRY_REGION[c]);
  }
  return { regions: [...regions], countries: [...countries] };
}

/* ---------- Cultural relevance (Lilia's invented facet) ---------- */
const CR_LABELS = {
  0: "0 · Not culturally tied",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5 · Strongly culturally tied",
};

export function crScore(recipe) {
  const cr = recipe["cultural relevance"];
  if (cr && typeof cr === "object" && cr.score !== null && cr.score !== undefined) return Number(cr.score);
  return null;
}

/* ---------- Time buckets (total_min) ---------- */
const TIME_BUCKETS = [
  { value: "≤ 15 min", max: 15 },
  { value: "16–30 min", max: 30 },
  { value: "31–60 min", max: 60 },
  { value: "1–2 hours", max: 120 },
  { value: "2–4 hours", max: 240 },
  { value: "4–12 hours", max: 720 },
  { value: "Over 12 hours", max: Infinity },
];

function timeBucket(recipe) {
  const t = recipe.time && recipe.time.total_min;
  if (t === null || t === undefined) return "Not given";
  return TIME_BUCKETS.find((b) => t <= b.max).value;
}

/* ---------- Number of ingredients ---------- */
export function ingredientCount(recipe) {
  // Combined lines ("salt and pepper") are split into several items with the
  // same raw text, so count distinct raw lines to match what the source printed.
  return new Set((recipe.ingredients || []).map((i) => i.raw)).size;
}

/* ---------- Ingredients (item names) ---------- */
function ingredientItems(recipe) {
  const items = new Set();
  for (const ing of recipe.ingredients || []) {
    if (ing.item) items.add(String(ing.item).trim().toLowerCase());
  }
  return [...items];
}

/* ---------- Source platform ---------- */
const SOCIAL = new Set(["instagram", "tiktok"]);
const MAGAZINES = new Set(["epicurious", "food network", "tasty", "hawaii magazine", "the old farmer's almanac", "lovefood"]);

function sourceType(recipe) {
  const site = (recipe.source && recipe.source.site || "").toLowerCase();
  const url = (recipe.source && recipe.source.url || "").toLowerCase();
  if (SOCIAL.has(site)) return "Social media";
  if (url.includes("substack.com") || site === "substack") return "Newsletter (Substack)";
  if (MAGAZINES.has(site)) return "Magazine / media site";
  return "Personal blog or site";
}

export function titleCase(s) {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/* ---------- The facet list ---------- */
export const FACETS = [
  {
    id: "cr",
    label: "Cultural Relevance",
    hint: "A number 0 to 5 representing how tied a recipe is to a specific culture or tradition. Where:\n0 - Not Culturally Tied\n5 - Strongly Culturally Tied",
    values: (r) => { const s = crScore(r); return s === null ? ["Unlabeled"] : [String(s)]; },
    order: ["5", "4", "3", "2", "1", "0", "Unlabeled"],
    display: (v) => CR_LABELS[v] || v,
  },
  {
    id: "region",
    label: "Region",
    values: (r) => { const c = cleanCuisine(r).regions; return c.length ? c : ["No region"]; },
    pinLast: ["No region"],
  },
  {
    id: "country",
    label: "Country",
    values: (r) => { const c = cleanCuisine(r).countries; return c.length ? c : ["No country"]; },
    collapsedLimit: 8,
    searchable: true,
    pinLast: ["No country"],
  },
  {
    id: "time",
    label: "Cooking Time",
    values: (r) => [timeBucket(r)],
    order: [...TIME_BUCKETS.map((b) => b.value), "Not given"],
  },
  {
    id: "ingredient",
    label: "Ingredients",
    hint: "Checking several shows recipes with all of them.",
    values: ingredientItems,
    collapsedLimit: 8,
    searchable: true,
    matchAll: true,
    display: titleCase,
  },
  {
    id: "stype",
    label: "Source",
    values: (r) => [sourceType(r)],
  },
  {
    id: "site",
    label: "Source Site",
    values: (r) => [r.source && r.source.site ? r.source.site : "unknown"],
    collapsedLimit: 6,
    display: titleCase,
  },
  {
    id: "kind",
    label: "Recipe Type",
    hint: "Sub-recipes (crusts, sauces, stocks) are used inside another recipe.",
    values: (r) => [r._isSubRecipe ? "Sub-recipe" : "Main recipe"],
    order: ["Main recipe", "Sub-recipe"],
  },
];
