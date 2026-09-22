// ============================================================
// Yumitask — edge function: подтверждение выполнения задания
// (только работодатель). Атомарно зачисляет награду исполнителю
// и списывает с баланса работодателя. Плата не вычитается из
// работодателя тут — баланс работодателя проверяется при
// публикации задания.
//
// POST { assignment_id, task_id, user_id (работодатель) }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { assignment_id, user_id } = await req.json();
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. берём отклик
    const { data: a, error: e1 } = await sb.from('assignments')
      .select('*').eq('id', assignment_id).single();
    if (e1 || !a) return Response.json({ error: 'Отклик не найден' }, { status: 404 });
    if (String(a.user_id) === String(user_id)) {
      return Response.json({ error: 'Это ваше задание — подтверждает работодатель' }, { status: 403 });
    }

    // 2. задание и его работодатель
    const { data: task, error: e2 } = await sb.from('tasks')
      .select('*').eq('id', a.task_id).single();
    if (e2 || !task) return Response.json({ error: 'Задание не найдено' }, { status: 404 });
    if (String(task.employer_id) !== String(user_id)) {
      return Response.json({ error: 'Только работодатель может подтвердить' }, { status: 403 });
    }

    // 3. статус отклика должен быть "pending"
    if (a.status !== 'pending') {
      return Response.json({ error: 'Отклик не на проверке' }, { status: 400 });
    }

    // 4. атомарное начисление: списание у работодателя и зачисление исполнителю
    const reward = a.reward || task.reward || 0;

    const { error: decErr } = await sb.rpc('change_balance', {
      p_user_id: Number(task.employer_id),
      p_delta: -reward,
      p_type: 'expense',
      p_title: 'Оплата задания «' + task.title + '»'
    });
    if (decErr) {
      return Response.json({ error: 'Не хватает средств на балансе работодателя' }, { status: 400 });
    }

    const { error: incErr } = await sb.rpc('change_balance', {
      p_user_id: Number(a.user_id),
      p_delta: reward,
      p_type: 'income',
      p_title: 'Выполнение задания «' + task.title + '»'
    });
    if (incErr) {
      // откатываем списание (примерно): если зачисление не удалось — вернём ошибку
      await sb.rpc('change_balance', {
        p_user_id: Number(task.employer_id),
        p_delta: reward,
        p_type: 'income',
        p_title: 'Возврат по заданию «' + task.title + '»'
      });
      return Response.json({ error: 'Ошибка начисления: ' + incErr.message }, { status: 500 });
    }

    // 5. отклик → done
    const { error: e3 } = await sb.from('assignments')
      .update({ status: 'done' })
      .eq('id', assignment_id);
    if (e3) {
      return Response.json({ error: 'Ошибка статуса: ' + e3.message }, { status: 500 });
    }

    return Response.json({ ok: true, reward, worker_id: a.user_id }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}