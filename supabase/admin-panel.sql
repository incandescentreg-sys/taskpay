-- ============================================================
-- Yumitask — админ-панель: поля is_admin / is_blocked
-- Выполнить в Supabase → SQL Editor ПОСЛЕ schema.sql,
-- policies-mvp.sql и users-uid.sql.
--
-- ВАЖНО: после выполнения отметьте себя администратором:
--   update public.users set is_admin = true where id = <ВАШ_TELEGRAM_ID>;
-- (узнать свой id: запустить бота в Telegram, in меню «Профиль» → ID)
-- ============================================================

-- Пользователь является администратором платформы
alter table public.users add column if not exists is_admin boolean not null default false;

-- Пользователь заблокирован (не может брать задания, создавать, писать)
alter table public.users add column if not exists is_blocked boolean not null default false;

-- Индекс для быстрого поиска по UID в админ-панели
create index if not exists idx_users_uid on public.users (uid);

-- Комментарий-подсказка для админа:
--   update public.users set is_admin = true where id = 123456789;
--   update public.users set is_admin = true where uid = 'ABC123';