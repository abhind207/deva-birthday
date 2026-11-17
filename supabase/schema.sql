-- =====================================================================
-- Deva birthday site — Supabase schema, RLS, RPCs and storage
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Admin allow-list ----------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- No policies on purpose: the table is only read through is_admin().

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- Secure bootstrap helper for the website owner/admin.
-- This is intentionally not exposed to the browser app;
-- run it once in Supabase SQL Editor for the real admin email.
create or replace function public.set_admin_by_email(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user_id uuid;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'email is required';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(btrim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'No Supabase user found for that email';
  end if;

  insert into public.admin_users (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;
end $$;

revoke all on function public.is_admin() from public;
revoke all on function public.set_admin_by_email(text) from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Tables ----------------------------------------------------
create table if not exists public.funny_questions (
  id uuid primary key default gen_random_uuid(),
  position smallint not null unique check (position between 1 and 20),
  question_text text not null,
  input_type text not null check (input_type in ('text','textarea','choice')),
  options jsonb,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.question_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  question_number smallint not null references public.funny_questions(position) on update cascade,
  answer_text text check (answer_text is null or char_length(answer_text) <= 5000),
  answer_choice text check (answer_choice in ('yes','no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_number)
);

create table if not exists public.proposal_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  no_attempts integer not null default 0 check (no_attempts >= 0),
  no_attempt_times timestamptz[] not null default '{}',
  final_choice text check (final_choice in ('yes')),
  first_seen_at timestamptz not null default now(),
  final_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_replies (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  reply_text text,
  status text not null check (status in ('submitted','skipped')),
  created_at timestamptz not null default now(),
  constraint reply_matches_status check (
    (status = 'submitted' and reply_text is not null
       and char_length(btrim(reply_text)) > 0 and char_length(reply_text) <= 10000)
    or (status = 'skipped' and reply_text is null)
  )
);

create table if not exists public.music_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  file_path text,
  file_name text,
  fade_out_seconds numeric(4,1) not null default 3 check (fade_out_seconds between 0.5 and 15),
  updated_at timestamptz not null default now()
);
insert into public.music_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.website_analytics (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_type text not null check (event_type in ('page_view','questions_completed','music_play')),
  path text,
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists analytics_session_idx on public.website_analytics (session_id);
create index if not exists analytics_created_idx on public.website_analytics (created_at desc);

-- Reference questions (exact wording)
insert into public.funny_questions (position, question_text, input_type) values
  (1, 'Nmde schoolill ninak Ettom miss cheynne entha?', 'text'),
  (2, 'Nammal ellarum thammil indarnappol ninak orthirikkan enthellum nalla memories indavulo ath entha?', 'textarea')
on conflict (position) do nothing;
insert into public.funny_questions (position, question_text, input_type, options) values
  (3, 'Are you enjoying this little surprise?', 'choice', '["yes","no"]'::jsonb)
on conflict (position) do nothing;

-- ---------- Row Level Security ---------------------------------------
alter table public.funny_questions    enable row level security;
alter table public.question_responses enable row level security;
alter table public.proposal_responses enable row level security;
alter table public.personal_replies   enable row level security;
alter table public.music_settings     enable row level security;
alter table public.website_analytics  enable row level security;

-- Public visitors get NO direct table access to private data.
-- They write only through the validated SECURITY DEFINER functions below.
drop policy if exists "questions public read" on public.funny_questions;
create policy "questions public read" on public.funny_questions for select to anon, authenticated using (true);
drop policy if exists "questions admin write" on public.funny_questions;
create policy "questions admin write" on public.funny_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "music public read" on public.music_settings;
create policy "music public read" on public.music_settings for select to anon, authenticated using (true);
drop policy if exists "music admin insert" on public.music_settings;
create policy "music admin insert" on public.music_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "music admin update" on public.music_settings;
create policy "music admin update" on public.music_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "responses admin read" on public.question_responses;
create policy "responses admin read" on public.question_responses for select to authenticated using (public.is_admin());
drop policy if exists "proposal admin read" on public.proposal_responses;
create policy "proposal admin read" on public.proposal_responses for select to authenticated using (public.is_admin());
drop policy if exists "replies admin read" on public.personal_replies;
create policy "replies admin read" on public.personal_replies for select to authenticated using (public.is_admin());
drop policy if exists "analytics admin read" on public.website_analytics;
create policy "analytics admin read" on public.website_analytics for select to authenticated using (public.is_admin());

-- ---------- Public write functions (validated) ------------------------
create or replace function public.track_event(p_session uuid, p_event text, p_path text default null, p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_session is null then raise exception 'session required'; end if;
  insert into website_analytics (session_id, event_type, path, metadata)
  values (p_session, p_event, left(p_path, 200), coalesce(p_meta, '{}'::jsonb));
end $$;

create or replace function public.save_answer(p_session uuid, p_number integer, p_text text, p_choice text)
returns void language plpgsql security definer set search_path = public as $$
declare v_type text;
begin
  if p_session is null then raise exception 'session required'; end if;
  select input_type into v_type from funny_questions where position = p_number;
  if v_type is null then raise exception 'unknown question'; end if;
  if v_type = 'choice' then
    if p_choice not in ('yes','no') then raise exception 'invalid choice'; end if;
    p_text := null;
  else
    if p_text is null or char_length(btrim(p_text)) = 0 then raise exception 'answer required'; end if;
    if char_length(p_text) > 5000 then raise exception 'answer too long'; end if;
    p_choice := null;
  end if;
  insert into question_responses (session_id, question_number, answer_text, answer_choice)
  values (p_session, p_number, p_text, p_choice)
  on conflict (session_id, question_number)
  do update set answer_text = excluded.answer_text, answer_choice = excluded.answer_choice, updated_at = now();
end $$;

create or replace function public.proposal_no_attempt(p_session uuid, p_at timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := greatest(least(coalesce(p_at, now()), now()), now() - interval '1 day');
begin
  if p_session is null then raise exception 'session required'; end if;
  insert into proposal_responses (session_id, no_attempts, no_attempt_times)
  values (p_session, 1, array[v_at])
  on conflict (session_id) do update set
    no_attempts = proposal_responses.no_attempts + 1,
    no_attempt_times = case when cardinality(proposal_responses.no_attempt_times) < 500
                            then proposal_responses.no_attempt_times || v_at
                            else proposal_responses.no_attempt_times end,
    updated_at = now();
end $$;

create or replace function public.proposal_yes(p_session uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_session is null then raise exception 'session required'; end if;
  insert into proposal_responses (session_id, final_choice, final_at)
  values (p_session, 'yes', now())
  on conflict (session_id) do update set
    final_choice = 'yes',
    final_at = coalesce(proposal_responses.final_at, now()),
    updated_at = now();
end $$;

create or replace function public.submit_reply(p_session uuid, p_text text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_session is null then raise exception 'session required'; end if;

  if p_status = 'submitted' then
    if p_text is null or char_length(btrim(p_text)) = 0 then raise exception 'reply required'; end if;
    if char_length(p_text) > 10000 then raise exception 'reply too long'; end if;

    insert into personal_replies (session_id, reply_text, status)
    values (p_session, p_text, 'submitted')
    on conflict (session_id) do update set
      reply_text = excluded.reply_text,
      status = excluded.status,
      created_at = now();

  elsif p_status = 'skipped' then
    insert into personal_replies (session_id, reply_text, status)
    values (p_session, null, 'skipped')
    on conflict (session_id) do update set
      reply_text = excluded.reply_text,
      status = excluded.status,
      created_at = now();

  else
    raise exception 'invalid status';
  end if;
end $$;

revoke all on function public.track_event(uuid, text, text, jsonb) from public;
revoke all on function public.save_answer(uuid, integer, text, text) from public;
revoke all on function public.proposal_no_attempt(uuid, timestamptz) from public;
revoke all on function public.proposal_yes(uuid) from public;
revoke all on function public.submit_reply(uuid, text, text) from public;
grant execute on function public.track_event(uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.save_answer(uuid, integer, text, text) to anon, authenticated;
grant execute on function public.proposal_no_attempt(uuid, timestamptz) to anon, authenticated;
grant execute on function public.proposal_yes(uuid) to anon, authenticated;
grant execute on function public.submit_reply(uuid, text, text) to anon, authenticated;

-- ---------- Storage: music bucket -------------------------------------
-- Public bucket: anyone can PLAY a file by URL; only admins can list/upload/replace/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('music', 'music', true, 20971520, array['audio/mpeg','audio/mp3'])
on conflict (id) do update set public = true, file_size_limit = 20971520,
  allowed_mime_types = array['audio/mpeg','audio/mp3'];

drop policy if exists "music objects admin select" on storage.objects;
create policy "music objects admin select" on storage.objects for select to authenticated
  using (bucket_id = 'music' and public.is_admin());
drop policy if exists "music objects admin insert" on storage.objects;
create policy "music objects admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'music' and public.is_admin());
drop policy if exists "music objects admin update" on storage.objects;
create policy "music objects admin update" on storage.objects for update to authenticated
  using (bucket_id = 'music' and public.is_admin()) with check (bucket_id = 'music' and public.is_admin());
drop policy if exists "music objects admin delete" on storage.objects;
create policy "music objects admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'music' and public.is_admin());

-- ---------- AFTER running this file ------------------------------------
-- 1. Dashboard → Authentication → Users → make sure your real admin account exists.
-- 2. Make that specific account an admin (replace the email):
--      select public.set_admin_by_email('you@example.com');
--    or the equivalent direct insert if you are already comfortable in SQL:
--      insert into public.admin_users (user_id)
--      select id from auth.users where email = 'you@example.com'
--      on conflict (user_id) do nothing;
-- 3. Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".
