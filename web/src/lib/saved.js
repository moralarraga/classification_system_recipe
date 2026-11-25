/* Saved recipes: kept in localStorage, and synced to Supabase when signed in. */
import {supabase} from './supabase.js';

const KEY = 'saved-recipes';
export const local = {
  get() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } },
  set(s) { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* private mode */ } },
};

export async function loadRemote(user) {
  const {data, error} = await supabase.from('saved_recipes').select('recipe_id').eq('user_id', user.id);
  if (error) throw error;
  return new Set(data.map((d) => d.recipe_id));
}

export async function saveRemote(user, id, on) {
  const q = supabase.from('saved_recipes');
  const {error} = on
    ? await q.upsert({user_id: user.id, recipe_id: id})
    : await q.delete().eq('user_id', user.id).eq('recipe_id', id);
  if (error) throw error;
}
