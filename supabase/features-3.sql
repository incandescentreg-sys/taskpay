-- ============================================================
-- Yumitask — галочка верификации + реферальная система
-- Выполнить в Supabase SQL Editor ПОСЛЕ features-2.sql.
-- ============================================================

-- Галочка верификации (подтверждённый пользователь)
alter table public.users add column if not exists is_verified boolean not null default false;

-- Реферальная система: кто пригласил пользователя
alter table public.users add column if not exists referred_by bigint;
alter table public.users add column if not exists referred_bonus boolean not null default false;

-- Бонусы за реферала (начисления администратором запишутся в transactions)