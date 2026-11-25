# Recipe Browser (Info 202 faceted browser)

Same stack as the 253A NASA Time Capsule project: Vite + React 18 + Framer Motion, optional Supabase, deploys on Vercel.
Needs Node 20.19+ or 22.12+ (check with `node -v`).

## Run locally
    npm install
    npm run dev        # http://localhost:5173
    npm test           # facet, search and URL tests (node --test)

### npm 12 and install scripts
npm 12 blocks dependency install scripts unless the project approves them. `package.json` already approves the
two this project can use (`allowScripts`: `esbuild`, `fsevents`), so `npm install` should not warn about them.
If npm still lists a blocked package, run `npm install-scripts ls` to see it and
`npm install-scripts approve <name>` to allow it, then `npm install` again.

## Data
`public/recipes.json` is a copy of `recipes/recipes_fixed.json`. When the recipes change, copy the new file over it.

## Facets
Defined in `src/lib/facets.js` (edit the `FACETS` array to add, drop or rename one):
cultural relevance (0-5), region, country/origin, total time, contains ingredient, source type, source site, recipe type (main vs sub-recipe).
Values in one facet are OR'd, different facets are AND'd ("contains ingredient" is AND). Counts show what checking a value would give.
Cuisine spellings are merged for display only (USA / United States / America -> USA, Asian -> Asia, ...); recipes.json is not changed.

## Search
`src/lib/search.js` is BM25 (k1 = 1.2, b = 0.75; title counted x3, ingredient items x2). Match these to the IR evaluation if it uses other settings.

## Saved recipes + accounts (Supabase, optional)
The heart button saves a recipe in the browser. To sync saved recipes across devices:
1. Create a free project at supabase.com.
2. SQL Editor: run `supabase/schema.sql` (creates `saved_recipes` with row-level security).
3. Authentication > Providers: enable Email (magic link). Add your site URL under URL Configuration.
4. Copy `.env.example` to `.env` and paste your project URL and anon key.
Without keys the site works the same; the sign-in button is just hidden.

## Deploy (Vercel)
Push to GitHub, import the repo in Vercel (framework: Vite), and add the two env vars if you use Supabase.

## Shareable links
The URL hash keeps the search, filters, sort and open recipe (e.g. `#cr=5&region=Europe&recipe=r0004`), handy for the poster demo.
