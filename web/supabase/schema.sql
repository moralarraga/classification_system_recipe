-- Saved recipes, one row per (user, recipe). Run in the Supabase SQL editor.
create table saved_recipes(
  user_id uuid references auth.users on delete cascade,
  recipe_id text not null,
  saved_at timestamptz default now(),
  primary key (user_id, recipe_id));
alter table saved_recipes enable row level security;
create policy "own saved recipes" on saved_recipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
