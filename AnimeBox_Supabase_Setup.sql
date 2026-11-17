-- AnimeBox shared database setup for the Supabase project.
-- Run the entire script once in Supabase Dashboard > SQL Editor.
create table if not exists public.animebox_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.animebox_state (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;
alter table public.animebox_state enable row level security;
-- This policy keeps the current public-facing app functional. For production,
-- move privileged writes behind server-side functions and tighter policies.
drop policy if exists "AnimeBox public app access" on public.animebox_state;
create policy "AnimeBox public app access" on public.animebox_state for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.animebox_state to anon, authenticated;
-- Storage bucket for images and media uploaded from the Admin dashboard.
insert into storage.buckets (id, name, public, file_size_limit)
values ('animebox-media', 'animebox-media', true, 52428800)
on conflict (id) do update set public = true;
drop policy if exists "AnimeBox public media read" on storage.objects;
create policy "AnimeBox public media read" on storage.objects for select to anon, authenticated using (bucket_id = 'animebox-media');
drop policy if exists "AnimeBox public media upload" on storage.objects;
create policy "AnimeBox public media upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'animebox-media');
drop policy if exists "AnimeBox public media update" on storage.objects;
create policy "AnimeBox public media update" on storage.objects for update to anon, authenticated using (bucket_id = 'animebox-media') with check (bucket_id = 'animebox-media');
drop policy if exists "AnimeBox public media delete" on storage.objects;
create policy "AnimeBox public media delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'animebox-media');
-- Enable Realtime updates for the shared JSON document.
do $$ begin
  alter publication supabase_realtime add table public.animebox_state;
exception when duplicate_object then null;
when undefined_object then null;
end $$;

-- Atomic JSON path writes: prevents concurrent User/Admin tabs from overwriting
-- unrelated data when both update the shared AnimeBox state document.
create or replace function public.animebox_jsonb_set_path(
  target jsonb, path_parts text[], new_value jsonb, do_delete boolean default false
) returns jsonb
language plpgsql immutable as $$
declare
  head text;
  child jsonb;
  changed_child jsonb;
begin
  if coalesce(array_length(path_parts, 1), 0) = 0 then
    return coalesce(new_value, '{}'::jsonb);
  end if;
  head := path_parts[1];
  if array_length(path_parts, 1) = 1 then
    if do_delete then return coalesce(target, '{}'::jsonb) - head; end if;
    return jsonb_set(coalesce(target, '{}'::jsonb), array[head], coalesce(new_value, 'null'::jsonb), true);
  end if;
  child := coalesce(target, '{}'::jsonb)->head;
  if child is null or jsonb_typeof(child) <> 'object' then child := '{}'::jsonb; end if;
  changed_child := public.animebox_jsonb_set_path(child, path_parts[2:array_length(path_parts, 1)], new_value, do_delete);
  return jsonb_set(coalesce(target, '{}'::jsonb), array[head], changed_child, true);
end;
$$;

create or replace function public.animebox_set_path(
  p_path text[], p_value jsonb, p_delete boolean default false
) returns jsonb
language plpgsql security invoker as $$
declare updated_data jsonb;
begin
  update public.animebox_state
     set data = public.animebox_jsonb_set_path(data, p_path, p_value, p_delete),
         updated_at = now()
   where id = 1
   returning data into updated_data;
  if updated_data is null then raise exception 'AnimeBox state row is missing'; end if;
  -- Return a tiny marker instead of the whole document (much faster writes).
  -- The website patches its local copy itself.
  return jsonb_build_object('__ab_ok', true);
end;
$$;

grant execute on function public.animebox_set_path(text[], jsonb, boolean) to anon, authenticated;

-- ============================================================================
-- VIEW COUNTER (added): atomic, de-duplicated view counting
-- ----------------------------------------------------------------------------
-- Counts live in the same shared JSON document, under their own top-level node,
-- so content / seasons / episodes records are never touched:
--   views/{contentId}/total              -> total views of the movie/anime/series
--   views/{contentId}/episodes/{episodeId} -> views of one episode
-- Re-run this whole file: every statement is idempotent.
-- ============================================================================

-- One row per counted view. The primary key makes a repeated/retried request
-- with the same view_key a no-op, so a view can never be counted twice.
create table if not exists public.animebox_view_events (
  view_key   text primary key,
  content_id text not null,
  episode_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists animebox_view_events_created_idx on public.animebox_view_events (created_at);
alter table public.animebox_view_events enable row level security;
-- No policies on purpose: browsers cannot read or write this table directly,
-- only the SECURITY DEFINER function below can.
revoke all on public.animebox_view_events from anon, authenticated;

create or replace function public.animebox_register_view(
  p_content text, p_episode text, p_view_key text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  inserted_rows integer;
  d jsonb;
  c jsonb;
  eps jsonb;
  new_ep bigint;
  new_total bigint;
begin
  if coalesce(p_content,'') = '' or coalesce(p_episode,'') = '' or coalesce(p_view_key,'') = ''
     or length(p_content) > 120 or length(p_episode) > 120 or length(p_view_key) > 300
     or position('/' in p_content) > 0 or position('/' in p_episode) > 0 then
    return jsonb_build_object('counted', false, 'reason', 'invalid');
  end if;

  -- Duplicate guard: same view_key => nothing is counted.
  insert into public.animebox_view_events (view_key, content_id, episode_id)
  values (p_view_key, p_content, p_episode)
  on conflict (view_key) do nothing;
  get diagnostics inserted_rows = row_count;
  if inserted_rows = 0 then
    return jsonb_build_object('counted', false, 'reason', 'duplicate');
  end if;

  -- Row lock => concurrent viewers are applied one after another (no lost counts).
  select data into d from public.animebox_state where id = 1 for update;
  if d is null then
    raise exception 'AnimeBox state row is missing';
  end if;

  c   := coalesce(d->'views'->p_content, '{}'::jsonb);
  eps := coalesce(c->'episodes', '{}'::jsonb);
  new_ep    := coalesce(nullif(eps->>p_episode, '')::bigint, 0) + 1;
  new_total := coalesce(nullif(c->>'total', '')::bigint, 0) + 1;

  c := jsonb_set(c, '{total}', to_jsonb(new_total), true);
  c := jsonb_set(c, '{episodes}', jsonb_set(eps, array[p_episode], to_jsonb(new_ep), true), true);
  c := jsonb_set(c, '{lastViewAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint), true);
  d := jsonb_set(d, '{views}', jsonb_set(coalesce(d->'views', '{}'::jsonb), array[p_content], c, true), true);

  update public.animebox_state set data = d, updated_at = now() where id = 1;

  -- Housekeeping: dedupe keys are only needed for a short while.
  if random() < 0.01 then
    delete from public.animebox_view_events where created_at < now() - interval '3 days';
  end if;

  return jsonb_build_object('counted', true, 'total', new_total, 'episode', new_ep);
end;
$$;

grant execute on function public.animebox_register_view(text, text, text) to anon, authenticated;
