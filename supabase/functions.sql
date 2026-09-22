-- ============================================================
-- Yumitask — server-side функция баланса
-- Выполнить в Supabase SQL Editor ПОСЛЕ schema.sql и policies-mvp.sql
-- Вызывается из edge-функций (complete-assignment, request-payout).
-- ============================================================

-- Атомарное изменение баланса + запись транзакции
create or replace function public.change_balance(
  p_user_id bigint,
  p_delta double precision,
  p_type text,
  p_title text default ''
)
returns double precision
language plpgsql
security definer
as $$
declare
  v_new_balance double precision;
begin
  update public.users
     set balance = greatest(0, balance + p_delta)
   where id = p_user_id
   returning balance into v_new_balance;

  if not found then
    raise exception 'user not found';
  end if;

  if p_delta <> 0 then
    insert into public.transactions (user_id, type, amount, title)
    values (p_user_id, p_type, abs(p_delta), p_title);
  end if;

  return v_new_balance;
end;
$$;

-- Вывод средств: помечает заявку на выплату (статус pending)
create table if not exists public.payouts (
  id bigserial primary key,
  user_id bigint not null references public.users(id),
  amount double precision not null,
  status text not null default 'pending',   -- pending | paid | rejected
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payouts enable row level security;
drop policy if exists "payouts_all" on public.payouts;
create policy "payouts_all" on public.payouts for all using (true) with check (true);

-- Списание баланса при подаче заявки на вывод
create or replace function public.request_payout(
  p_user_id bigint,
  p_amount double precision
)
returns text
language plpgsql
security definer
as $$
declare
  v_balance double precision;
  v_id bigint;
begin
  if p_amount <= 0 then
    return 'MIN_AMOUNT';
  end if;

  select balance into v_balance from public.users where id = p_user_id;
  if v_balance is null then
    return 'USER_NOT_FOUND';
  end if;
  if v_balance < p_amount then
    return 'INSUFFICIENT';
  end if;

  -- замораживаем средства
  update public.users set balance = greatest(0, balance - p_amount) where id = p_user_id;

  insert into public.payouts (user_id, amount, status)
  values (p_user_id, p_amount, 'pending')
  returning id into v_id;

  insert into public.transactions (user_id, type, amount, title)
  values (p_user_id, 'expense', p_amount, 'Вывод средств (заявка #' || v_id || ')');

  return 'OK';
end;
$$;

grant execute on function public.change_balance(bigint, double precision, text, text) to anon, authenticated, service_role;
grant execute on function public.request_payout(bigint, double precision) to anon, authenticated, service_role;