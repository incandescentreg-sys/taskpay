-- ============================================================
-- Yumitask — схема базы данных (Supabase / PostgreSQL)
-- Выполнить в Supabase → SQL Editor (создаст таблицы + RLS)
-- ============================================================

-- ---------- Пользователи ----------
create table if not exists public.users (
  id bigint primary key,                -- Telegram user id
  name text not null default 'Гость',
  photo_url text,
  balance double precision not null default 0,
  role text not null default 'both',    -- 'employer' | 'worker' | 'both'
  worker_score double precision not null default 0,
  worker_count int not null default 0,
  employer_score double precision not null default 0,
  employer_count int not null default 0,
  subscription_until timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Задания ----------
create table if not exists public.tasks (
  id bigserial primary key,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  platform text not null default 'website',
  reward double precision not null default 0,
  spots_total int not null default 1,
  spots_left int not null default 1,
  duration_min int not null default 5,
  instruction text not null default '',
  proof text[] not null default '{}',
  employer_id bigint not null references public.users(id),
  employer_name text not null default '',
  deadline_days int not null default 7,
  status text not null default 'active', -- 'active' | 'paused' | 'closed'
  created_at timestamptz not null default now()
);

-- ---------- Отклики / выполнения ----------
create table if not exists public.assignments (
  id bigserial primary key,
  task_id bigint not null references public.tasks(id) on delete cascade,
  user_id bigint not null references public.users(id),
  user_name text not null default '',
  status text not null default 'in_progress', -- in_progress | pending | done | rejected
  reward double precision not null default 0,
  comment text,
  proof_type text,
  rated bool not null default false,
  rating int,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- ---------- Транзакции баланса ----------
create table if not exists public.transactions (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  type text not null,                    -- 'income' | 'expense'
  amount double precision not null,
  title text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Диалоги ----------
create table if not exists public.chats (
  id bigserial primary key,
  task_id bigint references public.tasks(id) on delete set null,
  user_a bigint not null,                -- id работодателя
  user_b bigint not null,                -- id исполнителя
  created_at timestamptz not null default now(),
  unique (task_id, user_a, user_b)
);

-- ---------- Сообщения ----------
create table if not exists public.messages (
  id bigserial primary key,
  chat_id bigint not null references public.chats(id) on delete cascade,
  from_user bigint not null,
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------- Индексы ----------
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_created on public.tasks(created_at desc);
create index if not exists idx_assignments_user on public.assignments(user_id);
create index if not exists idx_assignments_task on public.assignments(task_id);
create index if not exists idx_messages_chat on public.messages(chat_id, created_at);
create index if not exists idx_chats_user on public.chats(user_a);
create index if not exists idx_chats_user_b on public.chats(user_b);
create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY — безопасность на уровне БД
-- ============================================================
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.assignments enable row level security;
alter table public.transactions enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Пользователи: читать может любой, менять только себя
create policy "users_read" on public.users for select using (true);
create policy "users_update_self" on public.users for update using (auth.uid()::text = id::text);
create policy "users_insert_self" on public.users for insert with check (auth.uid()::text = id::text);

-- Задания: активные видит каждый, создавать может любой авторизованный,
-- менять — только владелец
create policy "tasks_read" on public.tasks for select using (status = 'active' or employer_id::text = auth.uid()::text);
create policy "tasks_insert" on public.tasks for insert with check (employer_id::text = auth.uid()::text);
create policy "tasks_update_owner" on public.tasks for update using (employer_id::text = auth.uid()::text);

-- Отклики: видит работодатель задания или сам исполнитель
create policy "assignments_select" on public.assignments for select using (
  user_id::text = auth.uid()::text or
  exists (select 1 from public.tasks t where t.id = task_id and t.employer_id::text = auth.uid()::text)
);
create policy "assignments_insert" on public.assignments for insert with check (user_id::text = auth.uid()::text);
create policy "assignments_update" on public.assignments for update using (
  user_id::text = auth.uid()::text or
  exists (select 1 from public.tasks t where t.id = task_id and t.employer_id::text = auth.uid()::text)
);

-- Транзакции: только свои
create policy "txn_select" on public.transactions for select using (user_id::text = auth.uid()::text);
create policy "txn_insert" on public.transactions for insert with check (user_id::text = auth.uid()::text);

-- Диалоги и сообщения: только участники
create policy "chat_select" on public.chats for select using (
  user_a::text = auth.uid()::text or user_b::text = auth.uid()::text
);
create policy "chat_insert" on public.chats for insert with check (
  user_a::text = auth.uid()::text or user_b::text = auth.uid()::text
);
create policy "msg_select" on public.messages for select using (
  exists (select 1 from public.chats c where c.id = chat_id and (c.user_a::text = auth.uid()::text or c.user_b::text = auth.uid()::text))
);
create policy "msg_insert" on public.messages for insert with check (
  exists (select 1 from public.chats c where c.id = chat_id and (c.user_a::text = auth.uid()::text or c.user_b::text = auth.uid()::text))
);