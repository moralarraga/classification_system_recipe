/* Groups ingredient names into base ingredients for the "Ingredients" facet.
 * The word lists live in src/data/ingredientVocabulary.js. */
import {DESCRIPTORS, SYNONYMS, KEEP_AS_IS, SINGULARS} from '../data/ingredientVocabulary.js';

// Whole words only: a hyphen counts as part of the word ("sun-dried" keeps "dried").
const descriptorRe = new RegExp(
  '(?<![\\w-])(' + [...DESCRIPTORS].sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])', 'g');
const keep = new Set(KEEP_AS_IS);

export function singular(word) {
  if (keep.has(word) || word.length <= 3) return word;
  if (SINGULARS[word]) return SINGULARS[word];
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('oes')) return word.slice(0, -2);                // tomatoes, potatoes
  if (/(ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2); // peaches, radishes
  if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

export function baseIngredient(item) {
  if (!item) return '';
  let s = String(item).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .split(',')[0];
  const original = singularLast(s.replace(/\s+/g, ' ').trim());
  if (SYNONYMS[original]) return SYNONYMS[original];
  s = s.replace(descriptorRe, ' ').replace(/\s+/g, ' ').trim();
  s = s ? singularLast(s) : original;                  // e.g. an item that is only "dried"
  return SYNONYMS[s] || s;
}

function singularLast(s) {
  const words = s.split(' ');
  words[words.length - 1] = singular(words[words.length - 1]);
  return words.join(' ');
}
