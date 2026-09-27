-- ============================================================
-- Yumitask — новости проекта
-- Выполнить в Supabase SQL Editor ПОСЛЕ features-3.sql.
-- ============================================================

create table if not exists public.news (
  id bigserial primary key,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;
drop policy if exists "news_all" on public.news;
create policy "news_all" on public.news for all using (true) with check (true);

grant select, insert, update, delete on public.news to anon, authenticated;
grant usage on sequence public.news_id_seq to anon, authenticated;