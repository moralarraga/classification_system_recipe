/* Controlled vocabulary for the "Ingredients" facet.
 *
 * Recipes name the same ingredient many ways ("Fresh Peaches", "Large Ripe
 * Peaches", "Poached Peach Halves"). The facet groups them under one base
 * ingredient ("Peach"). recipes.json is never changed; this only affects how
 * the facet groups values. Edit the lists below to tune the grouping.
 *
 * How a name is grouped (src/lib/ingredients.js):
 *   1. lowercase, drop accents, drop anything in parentheses or after a comma
 *   2. if the whole name (last word made singular) is in SYNONYMS, use that
 *      (this protects names like "dried shrimp" from step 3)
 *   3. remove DESCRIPTORS (size, state, preparation words), whole words only,
 *      so "dry" is removed from "dry white wine" but not from "sun-dried"
 *   4. make the last word singular ("peaches" -> "peach")
 *   5. look the result up in SYNONYMS
 */

// "salted" is not here on purpose: a salted egg is a different ingredient from an egg.
// Words that describe size, freshness or preparation, not what the ingredient is.
// Do NOT add words that change the ingredient (e.g. "sweet" in sweet potato,
// "hot" in hot sauce, colors like "red" in red onion).
export const DESCRIPTORS = [
  // size
  'large', 'medium', 'small', 'big', 'jumbo', 'extra-large', 'extra large', 'baby', 'mini',
  // freshness / state
  'fresh', 'freshly', 'ripe', 'raw', 'frozen', 'thawed', 'canned', 'jarred', 'dried', 'dry',
  'cooked', 'uncooked', 'leftover', 'cold', 'warm', 'room temperature', 'softened', 'melted', 'chilled',
  'organic', 'store-bought', 'homemade', 'good-quality', 'good quality', 'high-quality', 'best-quality',
  // preparation
  'chopped', 'finely', 'coarsely', 'roughly', 'thinly', 'minced', 'diced', 'sliced', 'grated',
  'shredded', 'crushed', 'ground', 'peeled', 'pitted', 'seeded', 'trimmed', 'halved', 'halves',
  'quartered', 'cubed', 'julienned', 'torn', 'packed', 'lightly', 'firmly', 'poached', 'roasted',
  'toasted', 'blanched', 'boiled', 'steamed', 'mashed', 'whole', 'boneless', 'skinless', 'bone-in',
  'skin-on', 'low-sodium', 'reduced-sodium', 'unsalted', 'plain', 'sprigs',
  'sprig', 'stalks', 'stalk', 'pieces', 'piece', 'wedges', 'florets',
];

// Exact renames: 'name': 'group it belongs to'. Also used to protect a name
// from losing a descriptor that matters (map it to itself).
export const SYNONYMS = {
  // keep as their own ingredient
  'dried shrimp': 'dried shrimp',
  'toasted dried shrimp': 'dried shrimp',
  'roasted pepper': 'roasted pepper',
  'roasted red pepper': 'roasted red pepper',
  'whole grain mustard': 'whole grain mustard',
  'whole wheat flour': 'whole wheat flour',
  'ground beef': 'ground beef',
  'lean ground beef': 'ground beef',
  'ground lamb': 'ground lamb',
  'ground pork': 'ground pork',
  'ground turkey': 'ground turkey',
  // herbs named by their leaves
  'basil leaf': 'basil',
  'mint leaf': 'mint',
  'parsley leaf': 'parsley',
  'flat-leaf parsley leaf': 'flat-leaf parsley',
  'cilantro leaf': 'cilantro',
  'thyme leaf': 'thyme',
  'sage leaf': 'sage',
  'fresh coriander': 'cilantro',
  'garlic clove': 'garlic',
  // same ingredient, different name
  'parmigiano-reggiano': 'parmigiano reggiano',
  'scallion': 'green onion',
  'spring onion': 'green onion',
  'garbanzo bean': 'chickpea',
  'evoo': 'olive oil',
  'extra virgin olive oil': 'olive oil',
  'extra-virgin olive oil': 'olive oil',
  'kosher salt': 'salt',
  'sea salt': 'salt',
  'fine sea salt': 'salt',
  'flaky sea salt': 'salt',
  'table salt': 'salt',
  'all purpose flour': 'all-purpose flour',
  'chilli': 'chili',
  'jalapeno pepper': 'jalapeno',
  'bay': 'bay leaf',
  'salted butter': 'butter',
  'salted peanut': 'peanut',
};

// Words whose plural form is the normal name, or that look plural but aren't.
export const KEEP_AS_IS = [
  'molasses', 'hummus', 'couscous', 'asparagus', 'swiss', 'grits', 'oats', 'brussels',
  'greens', 'herbes', 'lentils', 'noodles', 'krispies', 'sprinkles', 'bitters', 'harissa', 'pancetta', 'feta',
];

// Irregular plurals.
export const SINGULARS = {
  chillies: 'chilli', leaves: 'leaf', loaves: 'loaf', halves: 'half', knives: 'knife',
  cookies: 'cookie', brownies: 'brownie', calories: 'calorie', smoothies: 'smoothie',
};
