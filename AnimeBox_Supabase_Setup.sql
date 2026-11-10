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
  return updated_data;
end;
$$;

grant execute on function public.animebox_set_path(text[], jsonb, boolean) to anon, authenticated;
