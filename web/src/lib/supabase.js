import {createClient} from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Without keys the site still works; saved recipes just stay in this browser.
export const supabase = url && key ? createClient(url, key) : null;
