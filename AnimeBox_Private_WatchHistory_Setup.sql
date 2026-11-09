-- Run this SQL once in Supabase SQL Editor.
-- Watch records are private: no anon/authenticated SELECT/INSERT/UPDATE/DELETE policies are created.
create table if not exists public.animebox_watch_history (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  auth_user_id uuid null,
  email text null,
  display_name text null,
  content_id text not null,
  title text not null,
  poster text null,
  content_type text null,
  content_url text null,
  ip_address text not null default 'unknown',
  first_watched_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  watch_count integer not null default 1,
  unique (actor_id, content_id)
);

alter table public.animebox_watch_history enable row level security;
revoke all on table public.animebox_watch_history from anon, authenticated;
grant all on table public.animebox_watch_history to service_role;

create or replace function public.animebox_track_watch(
  p_actor_id text,
  p_auth_user_id uuid,
  p_email text,
  p_display_name text,
  p_content_id text,
  p_title text,
  p_poster text,
  p_content_type text,
  p_content_url text,
  p_ip_address text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.animebox_watch_history (
    actor_id, auth_user_id, email, display_name, content_id, title,
    poster, content_type, content_url, ip_address
  ) values (
    p_actor_id, p_auth_user_id, p_email, p_display_name, p_content_id, p_title,
    p_poster, p_content_type, p_content_url, coalesce(nullif(p_ip_address, ''), 'unknown')
  )
  on conflict (actor_id, content_id) do update set
    auth_user_id = excluded.auth_user_id,
    email = coalesce(excluded.email, animebox_watch_history.email),
    display_name = coalesce(excluded.display_name, animebox_watch_history.display_name),
    title = excluded.title,
    poster = excluded.poster,
    content_type = excluded.content_type,
    content_url = excluded.content_url,
    ip_address = excluded.ip_address,
    last_watched_at = now(),
    watch_count = animebox_watch_history.watch_count + 1;
end;
$$;
revoke all on function public.animebox_track_watch(text, uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.animebox_track_watch(text, uuid, text, text, text, text, text, text, text, text) to service_role;
