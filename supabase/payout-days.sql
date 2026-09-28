-- ============================================================
-- Yumitask — срок выплаты в днях для заданий
-- Выполнить в Supabase SQL Editor.
-- ============================================================

alter table public.tasks add column if not exists payout_days int not null default 7;