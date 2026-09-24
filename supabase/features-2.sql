-- ============================================================
-- Yumitask — фичи: промокоды, жалобы, подписки на категории,
-- разблокировка публикаций. Выполнить в Supabase SQL Editor
-- ПОСЛЕ schema.sql и policies-mvp.sql.
-- ============================================================

-- ---------- Промокоды ----------
create table if not exists public.promocodes (
  id bigserial primary key,
  code text not null unique,
  bonus double precision not null default 0,
  uses_left int not null default 1,
  created_by bigint,
  created_at timestamptz not null default now()
);
create index if not exists idx_promocodes_code on public.promocodes (code);

-- ---------- Жалобы ----------
create table if not exists public.complaints (
  id bigserial primary key,
  user_id bigint not null,
  user_name text default '',
  task_id bigint,
  target_id bigint,
  target_name text default '',
  reason text default '',
  created_at timestamptz not null default now()
);

-- ---------- Дополнительные поля пользователей ----------
alter table public.users add column if not exists subscribed_categories text[] not null default '{}';
alter table public.users add column if not exists can_post_unlimited boolean not null default false;
alter table public.users add column if not exists promo_used bigint[] not null default '{}';

-- ---------- RLS (MVP: все могут читать/писать) ----------
alter table public.promocodes enable row level security;
drop policy if exists "promocodes_all" on public.promocodes;
create policy "promocodes_all" on public.promocodes for all using (true) with check (true);

alter table public.complaints enable row level security;
drop policy if exists "complaints_all" on public.complaints;
create policy "complaints_all" on public.complaints for all using (true) with check (true);

grant select, insert, update, delete on public.promocodes, public.complaints to anon, authenticated;
grant usage on sequence public.promocodes_id_seq, public.complaints_id_seq to anon, authenticated;