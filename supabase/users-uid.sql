-- ============================================================
-- Yumitask — миграция: уникальный публичный ID пользователя (uid)
-- Выполнить в Supabase SQL Editor ПОСЛЕ schema.sql
-- Каждый пользователь получает короткий 6-значный uid, по которому
-- его можно найти в профиле и написать ему.
-- ============================================================

-- 1. Поле uid
alter table public.users add column if not exists uid text;

-- 2. Уникальный индекс — гарантирует уникальность uid
create unique index if not exists users_uid_unique on public.users (uid) where uid is not null;

-- 3. Функция генерации свободного uid
create or replace function public.make_uid()
returns text
language plpgsql
as $$
declare
  v_uid text;
  v_taken boolean := true;
begin
  while v_taken loop
    -- 6 символов, без похожих букв/цифр (0, O, I, L не используем)
    v_uid := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    select exists(select 1 from public.users where uid = v_uid) into v_taken;
  end loop;
  return v_uid;
end;
$$;

-- 4. Триггер: проставляем uid при вставке, если его нет
create or replace function public.users_set_uid()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.uid is null or length(trim(new.uid)) = 0 then
    new.uid := public.make_uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_set_uid on public.users;
create trigger trg_users_set_uid
  before insert on public.users
  for each row execute function public.users_set_uid();

-- 5. Выдадим uid существующим пользователям, у кого его нет
update public.users set uid = public.make_uid() where uid is null;

-- 6. Права
grant execute on function public.make_uid() to anon, authenticated, service_role;