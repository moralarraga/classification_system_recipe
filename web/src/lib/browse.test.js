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
