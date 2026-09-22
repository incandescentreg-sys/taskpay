-- ============================================================
-- Yumitask — MVP-политики доступа (без Supabase Auth)
-- Выполнить ПОСЛЕ schema.sql, если приложение использует
-- Telegram id напрямую и не выдаёт JWT через edge function.
--
-- ВАЖНО: это ослабленные политики для рабочего прототипа.
-- Любой, у кого есть anon-ключ, может читать/писать данные.
-- Перед публичным запуском обязательно настроить авторизацию
-- через Telegram initData (edge function) и ужесточить политики.
-- ============================================================

-- Пользователи: читать и менять может любой (MVP)
drop policy if exists "users_read" on public.users;
drop policy if exists "users_update_self" on public.users;
drop policy if exists "users_insert_self" on public.users;
create policy "users_all" on public.users for all using (true) with check (true);

-- Задания: читать/создавать/менять может любой (MVP)
drop policy if exists "tasks_read" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update_owner" on public.tasks;
create policy "tasks_all" on public.tasks for all using (true) with check (true);

-- Отклики: любой может читать/создавать/менять (MVP)
drop policy if exists "assignments_select" on public.assignments;
drop policy if exists "assignments_insert" on public.assignments;
drop policy if exists "assignments_update" on public.assignments;
create policy "assignments_all" on public.assignments for all using (true) with check (true);

-- Транзакции: любой может читать/создавать (MVP)
drop policy if exists "txn_select" on public.transactions;
drop policy if exists "txn_insert" on public.transactions;
create policy "txn_all" on public.transactions for all using (true) with check (true);

-- Диалоги и сообщения: любой может читать/создавать (MVP)
drop policy if exists "chat_select" on public.chats;
drop policy if exists "chat_insert" on public.chats;
create policy "chat_all" on public.chats for all using (true) with check (true);
drop policy if exists "msg_select" on public.messages;
drop policy if exists "msg_insert" on public.messages;
create policy "msg_all" on public.messages for all using (true) with check (true);