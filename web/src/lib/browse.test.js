import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FACETS, cleanCuisine} from './facets.js';
import {prepare, filterRecipes, facetCounts, readHash, writeHash} from './browse.js';
import {buildSearchIndex, searchRecipes} from './search.js';

const recipes = JSON.parse(readFileSync(new URL('../../public/recipes.json', import.meta.url)));
const data = prepare(recipes);
const st = (o = {}) => ({selected: {}, scores: null, savedOnly: false, saved: new Set(), ...o});

test('no number-of-ingredients facet', () => {
  assert.ok(!FACETS.some((f) => f.id === 'ningr'));
});

test('no filters returns every recipe', () => {
  assert.equal(filterRecipes(data, st()).length, recipes.length);
});

test('OR within a facet, AND across facets', () => {
  const five = filterRecipes(data, st({selected: {cr: new Set(['5'])}})).length;
  const fiveOrFour = filterRecipes(data, st({selected: {cr: new Set(['5', '4'])}})).length;
  const fiveEurope = filterRecipes(data, st({selected: {cr: new Set(['5']), region: new Set(['Europe'])}})).length;
  assert.ok(fiveOrFour > five && fiveEurope < five);
});

test('facet counts add up to the result size for single-valued facets', () => {
  const s = st({selected: {region: new Set(['Europe'])}});
  const n = filterRecipes(data, s).length;
  const counts = facetCounts(data, s, FACETS.find((f) => f.id === 'cr'));
  assert.equal([...counts.values()].reduce((a, b) => a + b, 0), n);
});

test('cuisine spellings are merged', () => {
  assert.deepEqual(cleanCuisine({source_tags: {cuisine: ['Americas', 'United States']}}).countries, ['USA']);
  assert.deepEqual(cleanCuisine({source_tags: {cuisine: ['Asian', 'Korean']}}), {regions: ['Asia'], countries: ['Korea']});
});

test('sub-recipes are linked to their main recipe', () => {
  assert.ok(data.usedIn.get('r0265').some((r) => r.id === 'r0251'));
});

test('BM25 ranks a title match first', () => {
  const idx = buildSearchIndex(recipes);
  const scores = searchRecipes(idx, 'pecan pie');
  const top = [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
  assert.match(data.byId.get(top).title.toLowerCase(), /pecan/);
});

test('URL hash round-trips', () => {
  const s = {selected: {cr: new Set(['5']), country: new Set(['Italy'])}, query: 'pasta', sort: 'title', recipe: 'r0004', savedOnly: false};
  const back = readHash(writeHash(s));
  assert.equal(back.query, 'pasta');
  assert.deepEqual([...back.selected.country], ['Italy']);
  assert.equal(back.recipe, 'r0004');
});

test('search covers every field: "Mexico" finds every Mexico-tagged recipe', () => {
  const idx = buildSearchIndex(recipes);
  const scores = searchRecipes(idx, 'Mexico');
  const tagged = filterRecipes(data, st({selected: {country: new Set(['Mexico'])}}));
  assert.ok(tagged.length >= 13);
  for (const r of tagged) assert.ok(scores.has(r.id), r.id);
});

test('partial words match ("mex" finds Mexico recipes)', () => {
  const idx = buildSearchIndex(recipes);
  assert.ok(searchRecipes(idx, 'mex').size >= 13);
});

test('default sort is ID, or best match while searching', () => {
  assert.equal(readHash('').sort, 'id');
  assert.equal(readHash('#q=pie').sort, 'relevance');
  assert.equal(writeHash({selected: {}, query: '', sort: 'id'}), '');
});

test('ingredient facet groups variants of the same ingredient', async () => {
  const {baseIngredient} = await import('./ingredients.js');
  for (const x of ['Fresh Peaches', 'Large Ripe Peaches', 'Poached Peach Halves']) assert.equal(baseIngredient(x), 'peach');
  assert.equal(baseIngredient('large eggs'), 'egg');
  assert.equal(baseIngredient('scallions'), 'green onion');
  assert.equal(baseIngredient('minced garlic'), 'garlic');
  assert.equal(baseIngredient('canned diced tomatoes'), 'tomato');
  // no over-merging
  assert.equal(baseIngredient('peanut butter'), 'peanut butter');
  assert.equal(baseIngredient('coconut milk'), 'coconut milk');
  assert.equal(baseIngredient('sun-dried tomato'), 'sun-dried tomato');
  assert.equal(baseIngredient('salted egg'), 'salted egg');
  assert.equal(baseIngredient('curry leaves'), 'curry leaf');
  const peach = filterRecipes(data, st({selected: {ingredient: new Set(['peach'])}}));
  assert.ok(peach.length >= 1);
});
