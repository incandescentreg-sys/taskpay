/* ============================================================
   Yumitask — слой интеграции с Supabase (API + realtime)
   Подключение: index.html → <script src="js/api.js">
   Перед использованием укажите свои ключи внизу файла:
   - SUPABASE_URL (https://xxxx.supabase.co)
   - SUPABASE_ANON_KEY (public anon key из Dashboard → Settings → API)
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://olwyzvyprcfypbpetgvf.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_r1Ltg3tpWgem_D5Myyillg_59mbUGGr';

  var SB = null;
  var configured = false;

  function ensureClient() {
    if (SB) return true;
    if (!window.supabase) return false;
    try {
      SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      configured = true;
      return true;
    } catch (e) {
      console.error('supabase init error', e);
      return false;
    }
  }

  window.Api = {
    isConfigured() {
      /* инициализируем клиент прямо здесь — иначе флаг configured
         останется false до первого обращения к БД и app.js не включит
         синхронизацию (всё работало в демо-режиме) */
      const ok = configured || ensureClient();
      return ok && SUPABASE_URL.indexOf('ВАШ-ПРОЕКТ') === -1 &&
             SUPABASE_ANON_KEY.indexOf('eyJ...') === -1 &&
             SUPABASE_ANON_KEY.indexOf('sb_publishable') === 0;
    },

    /* ---------- Авторизация: verификация initData на edge-функции auth ---------- */
    async auth() {
      if (!ensureClient()) return null;
      const tg = window.Telegram && window.Telegram.WebApp;
      const initData = tg && tg.initData;
      if (!initData) return null;
      try {
        const res = await fetch(SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.token) {
          /* сохраняем наш JWT как access_token для будущих запросов */
          SB.auth.setSession({ access_token: data.token, refresh_token: '' });
          localStorage.setItem('yumitask_token', data.token);
        }
        return data.user || null;
      } catch (e) {
        console.error('auth error', e);
        return null;
      }
    },

    /* ---------- Авторизация fallback: напрямую таблица users (если edge нет) ---------- */
    async ensureUser() {
      if (!ensureClient()) return null;
      const tg = window.Telegram && window.Telegram.WebApp;
      const ud = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (!ud) return null;
      const id = Number(ud.id);
      const { data, error } = await SB.from('users')
        .select('*').eq('id', id).maybeSingle();
      if (error && error.code !== 'PGRST116') { console.error(error); return null; }
      if (!data) {
        const { data: ins, error: e2 } = await SB.from('users').insert({
          id: id,
          name: [ud.first_name, ud.last_name].filter(Boolean).join(' ') || 'Гость',
          photo_url: ud.photo_url || null
        }).select().maybeSingle();
        if (e2) { console.error(e2); return null; }
        return ins;
      }
      return data;
    },

    async getAllUsers() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users').select('id').limit(500);
      return error ? null : data;
    },

    /* ---------- Задания ---------- */
    async getTasks() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);
      return error ? null : data;
    },

    /* Задания на модерацию (видны только админу) */
    async getModerationTasks() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('tasks')
        .select('*')
        .eq('status', 'moderation')
        .order('created_at', { ascending: false })
        .limit(50);
      return error ? null : data;
    },

    /* Решение админа: выпустить (active) / отклонить (rejected) */
    async moderateTask(taskId, decision) {
      if (!ensureClient()) return null;
      if (decision !== 'approve') {
        /* при отклонении возвращаем замороженный бюджет работодателю */
        const t = await SB.from('tasks').select('*').eq('id', Number(taskId)).maybeSingle();
        if (t && t.data) {
          const budget = (Number(t.data.spots_total) || 0) * (Number(t.data.reward) || 0);
          if (budget > 0) {
            try {
              await SB.rpc('change_balance', {
                p_user_id: Number(t.data.employer_id), p_delta: budget,
                p_type: 'income', p_title: 'Возврат бюджета задания «' + (t.data.title || '') + '» (отклонено модерацией)'
              });
            } catch (e) {}
          }
          /* уведомим работодателя о решении */
          this._notify(Number(t.data.employer_id),
            '❌ Ваше задание <b>' + this._esc(t.data.title || '') + '</b> отклонено модерацией.<br>Бюджет возвращён на баланс.');
        }
        await SB.from('tasks')
          .update({ status: 'rejected', moderated_at: null }).eq('id', Number(taskId));
        return { ok: true };
      }
      const { data, error } = await SB.from('tasks')
        .update({ status: 'active' }).eq('id', Number(taskId)).select().single();
      if (!error && data) {
        /* уведомляем всех пользователей о новом задании только после одобрения */
        this._notifyNewTask(data);
        /* уведомим работодателя об одобрении */
        this._notify(Number(data.employer_id),
          '✅ Ваше задание <b>' + this._esc(data.title || '') + '</b> прошло модерацию и опубликовано на бирже!');
      }
      return error ? null : data;
    },

    /* Задания на бирже (для админ-панели) */
    async adminGetMarketTasks() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);
      return error ? null : data;
    },

    /* Реальная статистика платформы из БД (для админ-панели) */
    async adminGetStats() {
      if (!ensureClient()) return null;
      try {
        /* задачи: всего, на модерации, активных */
        const [allT, activeT, modT] = await Promise.all([
          SB.from('tasks').select('id'),
          SB.from('tasks').select('id').eq('status', 'active'),
          SB.from('tasks').select('id').eq('status', 'moderation')
        ]);
        /* отклики */
        const [asnAll, asnDone, asnPending] = await Promise.all([
          SB.from('assignments').select('id'),
          SB.from('assignments').select('id').eq('status', 'done'),
          SB.from('assignments').select('id').eq('status', 'pending')
        ]);
        /* пользователи и их балансы */
        const [usersAll, usersList] = await Promise.all([
          SB.from('users').select('id'),
          SB.from('users').select('balance, is_admin, is_blocked')
        ]);
        /* транзакции — оборот по платформе (весь приход исполнителям/работодателям) */
        const txns = await SB.from('transactions').select('amount, type');
        const txt = txns.data || [];
        const totalIncome = txt.filter(x => x.type === 'income').reduce((s, x) => s + (Number(x.amount) || 0), 0);
        const totalExpense = txt.filter(x => x.type === 'expense').reduce((s, x) => s + (Number(x.amount) || 0), 0);
        const usersTotal = (usersAll.data || []).length;
        const balanceTotal = (usersList.data || []).reduce((s, u) => s + (Number(u.balance) || 0), 0);
        return {
          tasksTotal: (allT.data || []).length,
          tasksActive: (activeT.data || []).length,
          tasksModeration: (modT.data || []).length,
          assignmentsTotal: (asnAll.data || []).length,
          assignmentsDone: (asnDone.data || []).length,
          assignmentsPending: (asnPending.data || []).length,
          usersTotal,
          balanceTotal,
          totalIncome,
          totalExpense
        };
      } catch (e) {
        return null;
      }
    },

    /* Удалить задание (только админ) — возвращаем оставшийся замороженный бюджет */
    async adminDeleteTask(taskId) {
      if (!ensureClient()) return null;
      const t = await SB.from('tasks').select('*').eq('id', Number(taskId)).maybeSingle();
      if (t && t.data) {
        const budget = (Number(t.data.spots_total) || 0) * (Number(t.data.reward) || 0);
        if (budget > 0) {
          try {
            await SB.rpc('change_balance', {
              p_user_id: Number(t.data.employer_id), p_delta: budget,
              p_type: 'income', p_title: 'Возврат бюджета задания «' + (t.data.title || '') + '» (удалено)'
            });
          } catch (e) {}
        }
      }
      const { error } = await SB.from('tasks')
        .delete().eq('id', Number(taskId));
      return error ? null : { ok: true };
    },

    /* ---------- Промокоды ---------- */
    async adminCreatePromocode(code, bonus, uses) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const { data, error } = await SB.from('promocodes').insert({
        code: String(code).trim().toUpperCase(),
        bonus: Number(bonus) || 0,
        uses_left: Number(uses) || 1
      }).select().single();
      return error ? { error: error.message } : data;
    },
    async adminGetPromocodes() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('promocodes').select('*').order('created_at', { ascending: false }).limit(50);
      return error ? null : data;
    },
    async adminDeletePromocode(id) {
      if (!ensureClient()) return null;
      const { error } = await SB.from('promocodes').delete().eq('id', Number(id));
      return error ? null : { ok: true };
    },

    /* Активировать промокод: начислить бонус, если не использован */
    async redeemPromocode(code, userId) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const c = String(code).trim().toUpperCase();
      const { data: pc, error: e1 } = await SB.from('promocodes').select('*').eq('code', c).maybeSingle();
      if (e1 || !pc) return { error: 'Промокод не найден' };
      if ((pc.uses_left || 0) <= 0) return { error: 'Промокод уже использован' };

      const { data: usr } = await SB.from('users').select('promo_used').eq('id', Number(userId)).maybeSingle();
      const used = (usr && usr.promo_used) || [];
      if (used.indexOf(pc.id) !== -1) return { error: 'Вы уже использовали этот промокод' };

      const r = await SB.rpc('change_balance', {
        p_user_id: Number(userId), p_delta: pc.bonus,
        p_type: 'income', p_title: 'Промокод ' + c
      });
      if (r.error) return { error: r.error.message };

      await SB.from('promocodes').update({ uses_left: Math.max(0, (pc.uses_left || 0) - 1) }).eq('id', pc.id);
      await SB.from('users').update({ promo_used: used.concat(pc.id) }).eq('id', Number(userId));
      return { ok: true, bonus: pc.bonus };
    },

    /* ---------- Жалобы ---------- */
    async sendComplaint(userId, userName, taskId, targetId, targetName, reason) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('complaints').insert({
        user_id: Number(userId), user_name: userName || '—',
        task_id: taskId ? Number(taskId) : null,
        target_id: targetId ? Number(targetId) : null,
        target_name: targetName || '—',
        reason: reason || ''
      }).select().single();
      return error ? null : data;
    },
    async adminGetComplaints() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('complaints').select('*').order('created_at', { ascending: false }).limit(50);
      return error ? null : data;
    },
    async adminDeleteComplaint(id) {
      if (!ensureClient()) return null;
      const { error } = await SB.from('complaints').delete().eq('id', Number(id));
      return error ? null : { ok: true };
    },

    /* ---------- Подписка на категории (уведомления по интересам) ---------- */
    async setCategorySubs(userId, cats) {
      if (!ensureClient()) return null;
      const arr = Array.isArray(cats) ? cats.map(c => String(c)) : [];
      const { data, error } = await SB.from('users').update({ subscribed_categories: arr }).eq('id', Number(userId)).select().single();
      return error ? null : data;
    },

    /* ---------- Топ исполнителей / работодателей (неделя) ---------- */
    async getTopUsers() {
      if (!ensureClient()) return null;
      try {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const done = await SB.from('assignments')
          .select('user_id, user_name, reward')
          .eq('status', 'done')
          .gte('created_at', since)
          .limit(200);
        const agg = {};
        (done.data || []).forEach(a => {
          const k = String(a.user_id);
          agg[k] = agg[k] || { id: a.user_id, name: a.user_name || 'Исполнитель', count: 0, sum: 0 };
          agg[k].count += 1;
          agg[k].sum += Number(a.reward) || 0;
        });
        return Object.values(agg).sort((a, b) => b.sum - a.sum).slice(0, 10);
      } catch (e) {
        return null;
      }
    },

    /* ---------- Админ: разблокировать публикацию заданий ---------- */
    async adminSetUnlimited(userId, val) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .update({ can_post_unlimited: !!val }).eq('id', Number(userId)).select().single();
      return error ? null : data;
    },

    async publishTask(task) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      /* замораживаем бюджет: со счёта работодателя списываем весь бюджет задания
         (мест × награда), чтобы исполнители гарантированно получили оплату */
      const budget = (Number(task.spots_total) || 0) * (Number(task.reward) || 0);
      const employerId = Number(task.employer_id);
      if (budget > 0) {
        const { data: bal } = await SB.from('users').select('balance').eq('id', employerId).maybeSingle();
        const cur = bal ? Number(bal.balance) : 0;
        if (cur < budget) {
          return { error: 'Недостаточно средств на балансе. Нужно ' + this._fmtRur(budget) + ', доступно ' + this._fmtRur(cur) };
        }
        const hold = await SB.rpc('change_balance', {
          p_user_id: employerId, p_delta: -budget,
          p_type: 'expense', p_title: 'Задание «' + (task.title || '') + '» — бюджет заморожен'
        });
        if (hold.error) return { error: 'Ошибка заморозки бюджета: ' + hold.error.message };
      }
      /* новое задание сначала идёт на модерацию, на биржу — после одобрения админом */
      const { data, error } = await SB.from('tasks').insert(Object.assign({}, task, {
        status: task.status && task.status === 'active' ? 'moderation' : (task.status || 'moderation')
      })).select().single();
      if (error) {
        /* возврат при неудаче вставки */
        if (budget > 0) {
          try {
            await SB.rpc('change_balance', {
              p_user_id: employerId, p_delta: budget,
              p_type: 'income', p_title: 'Возврат бюджета задания (не опубликовано)'
            });
          } catch (e) {}
        }
        return { error: error.message };
      }
      return data;
    },

    _fmtRur(n) {
      try { return Number(n || 0).toLocaleString('ru-RU') + ' ₽'; } catch (e) { return (n || 0) + ' ₽'; }
    },

    /* ---------- Взятие задания: отклик в БД (идемпотентно) ---------- */
    async takeTask(taskId, user) {
      if (!ensureClient()) return null;
      const { data: task, error: e1 } = await SB.from('tasks').select('*').eq('id', taskId).single();
      if (e1 || !task) return null;

      /* если уже брал это задание — возвращаем существующий отклик */
      const { data: exist } = await SB.from('assignments')
        .select('*')
        .eq('task_id', Number(taskId))
        .eq('user_id', Number(user.id))
        .maybeSingle();
      if (exist) return exist;

      const { data, error } = await SB.from('assignments').insert({
        task_id: Number(taskId),
        user_id: Number(user.id),
        user_name: user.name || 'Гость',
        status: 'in_progress',
        reward: task.reward || 0
      }).select().single();
      if (error) return null;
      /* уменьшаем число свободных мест */
      await SB.from('tasks')
        .update({ spots_left: Math.max(0, (task.spots_left || 1) - 1) })
        .eq('id', taskId);
      /* уведомление работодателю */
      this._notify(task.employer_id, '👤 <b>' + this._esc(user.name || 'Кто-то') + '</b> откликнулся на ваше задание <b>' + this._esc(task.title) + '</b>');
      return data;
    },

    async getAssignmentsForTask(taskId, employerId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .select('*').eq('task_id', taskId);
      return error ? null : data;
    },

    /* Мои задания как работодателя, с откликами */
    async getMyEmployedTasks(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('tasks')
        .select('*, assignments: assignments(*)')
        .eq('employer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return error ? null : data;
    },

    async getMyAssignments(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false });
      return error ? null : data;
    },

    async updateAssignment(id, patch) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .update(patch).eq('id', id).select().single();
      return error ? null : data;
    },

    /* ---------- Подтверждение выполнения (только БД — edge отключён, т.к. висел без таймаута) ---------- */
    async confirmAssignment(assignmentId, employerId) {
      if (!ensureClient()) return { ok: false, error: 'Нет соединения' };
      try {
        const a0 = await SB.from('assignments').select('*').eq('id', Number(assignmentId)).single();
        const a = a0 ? a0 : { data: null, error: { message: 'нет ответа' } };
        if (a.error || !a.data) return { ok: false, error: 'Отклик не найден' };
        const assign = a.data;

        const t0 = await SB.from('tasks').select('*').eq('id', assign.task_id).single();
        const tsk = t0 ? t0 : { data: null, error: { message: 'нет ответа' } };
        if (tsk.error || !tsk.data) return { ok: false, error: 'Задание не найдено' };
        const task = tsk.data;
        if (String(task.employer_id) !== String(employerId)) {
          return { ok: false, error: 'Только работодатель может подтвердить' };
        }
        if (assign.status !== 'pending') {
          return { ok: false, error: 'Отклик не на проверке (исполнитель ещё не отправил)' };
        }

        const reward = assign.reward || task.reward || 0;

        /* бюджет задания уже заморожен при публикации — здесь платим исполнителю
           из замороженной суммы, повторное списание у работодателя не нужно */
        /* начисляем исполнителю */
        const inc = await SB.rpc('change_balance', {
          p_user_id: Number(assign.user_id), p_delta: reward,
          p_type: 'income', p_title: 'Выполнение задания «' + task.title + '»'
        });
        if (inc.error) {
          return { ok: false, error: 'Ошибка начисления: ' + inc.error.message };
        }

        /* статус → done */
        const upd = await SB.from('assignments')
          .update({ status: 'done' }).eq('id', Number(assignmentId));
        if (upd.error) return { ok: false, error: upd.error.message };

        /* уведомление исполнителю: награда начислена */
        this._notify(assign.user_id, '✅ Ваше выполнение задания <b>' + this._esc(task.title) + '</b> подтверждено! На баланс начислено <b>' + Number(reward) + ' ₽</b>');

        return { ok: true, reward, worker_id: assign.user_id, task_id: assign.task_id, employer_id: task.employer_id };
      } catch (e) {
        return { ok: false, error: e.message || 'Ошибка подтверждения' };
      }
    },

    async rejectAssignment(assignmentId, employerId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .update({ status: 'rejected', rejection_reason: 'Отклонено работодателем' })
        .eq('id', assignmentId)
        .select().single();
      if (!error && data) {
        /* уведомление исполнителю */
        this._notify(data.user_id, '❌ Ваше выполнение задания #' + data.task_id + ' отклонено работодателем');
      }
      return error ? null : data;
    },

    /* ---------- Баланс и вывод ---------- */
    async getBalance(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .select('balance').eq('id', userId).maybeSingle();
      return error ? null : (data ? data.balance : 0);
    },

    /* ---------- UID пользователей ---------- */
    async getUserByUid(uid) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .select('id, name, photo_url, uid')
        .eq('uid', String(uid).trim().toUpperCase())
        .maybeSingle();
      return error ? null : data;
    },

    async getMyUid(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .select('uid').eq('id', userId).maybeSingle();
      return error ? null : (data ? data.uid : null);
    },

    /* История транзакций (реальные списания/начисления) */
    async getTransactions(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('transactions')
        .select('*')
        .eq('user_id', Number(userId))
        .order('created_at', { ascending: false })
        .limit(100);
      return error ? null : data;
    },

    /* Имя и аватарка пользователя для чатов */
    async getUserInfo(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .select('id, name, photo_url, uid, is_admin')
        .eq('id', Number(userId))
        .maybeSingle();
      return error ? null : data;
    },

    /* Рассылка сообщения всем пользователям (для админа) */
    async adminBroadcast(text) {
      try {
        const all = await this.getAllUsers();
        if (!all || !all.length) return { ok: false, error: 'Нет пользователей' };
        const messages = all.map(u => ({ chat_id: Number(u.id), text: '📢 ' + text }));
        for (let i = 0; i < messages.length; i += 50) {
          this._callEdge('notify', { messages: messages.slice(i, i + 50) }).catch(() => {});
        }
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    /* Создать/найти чат с пользователем (опционально по заданию) */
    async findOrCreateChat(userA, userB, taskId) {
      if (!ensureClient()) return null;
      const a = Number(userA), b = Number(userB);
      if (a === b) return null;
      const withTask = taskId
        ? '.eq(task_id.' + Number(taskId) + ')'
        : '';
      /* ищем существующий чат в обе стороны, при задании — по нему */
      let query = SB.from('chats')
        .select('*')
        .or('and(user_a.eq.' + a + ',user_b.eq.' + b + '),and(user_a.eq.' + b + ',user_b.eq.' + a + ')');
      if (withTask) query = query.eq('task_id', Number(taskId));
      const { data: existing } = await query.maybeSingle();
      if (existing) return existing;
      const { data, error } = await SB.from('chats')
        .insert({ user_a: a, user_b: b, task_id: taskId ? Number(taskId) : null })
        .select().single();
      return error ? null : data;
    },

    async requestPayout(userId, amount) {
      return this._callRpc('request_payout', {
        p_user_id: Number(userId), p_amount: Number(amount)
      });
    },

    /* ---------- Админ-панель ---------- */
    async adminFindUser(uid) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('users')
        .select('*')
        .eq('uid', String(uid).trim().toUpperCase())
        .maybeSingle();
      return error ? null : data;
    },

    /* Начислить деньги (плюс на баланс + запись транзакции) */
    async adminGiveMoney(userId, amount, note) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const amt = Math.max(0, Number(amount) || 0);
      if (amt <= 0) return { error: 'Сумма должна быть больше 0' };
      const { data, error } = await SB.rpc('change_balance', {
        p_user_id: Number(userId), p_delta: amt,
        p_type: 'income', p_title: note || 'Начислено администратором'
      });
      return error ? { error: error.message } : { ok: true, balance: data };
    },

    /* Списать деньги (минус с баланса) */
    async adminTakeMoney(userId, amount, note) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const amt = Math.max(0, Number(amount) || 0);
      if (amt <= 0) return { error: 'Сумма должна быть больше 0' };
      const { data, error } = await SB.rpc('change_balance', {
        p_user_id: Number(userId), p_delta: -amt,
        p_type: 'expense', p_title: note || 'Списано администратором'
      });
      return error ? { error: error.message } : { ok: true, balance: data };
    },

    /* Установить баланс напрямую (точное значение) */
    async adminSetBalance(userId, newBalance) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const val = Math.max(0, Number(newBalance) || 0);
      const { error } = await SB.from('users')
        .update({ balance: val }).eq('id', Number(userId));
      return error ? { error: error.message } : { ok: true, balance: val };
    },

    /* Заблокировать / разблокировать */
    async adminSetBlocked(userId, blocked) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const { error } = await SB.from('users')
        .update({ is_blocked: !!blocked }).eq('id', Number(userId));
      return error ? { error: error.message } : { ok: true };
    },

    /* Сделать администратором / снять */
    async adminSetAdmin(userId, isAdmin) {
      if (!ensureClient()) return { error: 'Нет соединения' };
      const { error } = await SB.from('users')
        .update({ is_admin: !!isAdmin }).eq('id', Number(userId));
      return error ? { error: error.message } : { ok: true };
    },

    /* Все отклики «на проверке» по всем заданиям (для админ-панели) */
    async adminGetPendingAssignments() {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .select('*, tasks(id, title, reward, employer_id, employer_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);
      return error ? null : data;
    },

    /* ---------- Внутренние хелперы ---------- */
    async _callEdge(fn, body) {
      if (!ensureClient()) return null;
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
      try {
        const res = await fetch(SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/' + fn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
          signal: ctrl ? ctrl.signal : undefined
        });
        return await res.json();
      } catch (e) {
        console.error(fn + ' error', e);
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    },

    async _callRpc(fn, params) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.rpc(fn, params);
      return error ? { error: error.message } : data;
    },

    /* Отправка push-уведомления в Telegram (edge-функция notify).
       Fire-and-forget: не ждём результат, чтобы не тормозить основной поток. */
    _notify(chatId, text) {
      try {
        this._callEdge('notify', { chat_id: Number(chatId), text: String(text) }).catch(() => {});
      } catch (e) {}
      return true;
    },
    /* уведомление о новом задании всем пользователям */
    async _notifyNewTask(task) {
      try {
        const all = await this.getAllUsers();
        if (!all || !all.length) return;
        const msg = '📢 Новое задание: <b>' + this._esc(task.title) + '</b> — ' + Number(task.reward) + ' ₽';
        const messages = all.map(u => ({ chat_id: Number(u.id), text: msg }));
        /* шлём батчем по 50 */
        for (let i = 0; i < messages.length; i += 50) {
          this._callEdge('notify', { messages: messages.slice(i, i + 50) }).catch(() => {});
        }
      } catch (e) {}
    },
    _esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    },

    /* ---------- Чат: список диалогов ---------- */
    async getChats(userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('chats')
        .select('*, messages: messages(id, text, created_at, from_user)')
        .or('user_a.eq.' + userId + ',user_b.eq.' + userId)
        .order('created_at', { ascending: false });
      return error ? null : data;
    },

    /* Один чат по id (для определения собеседника) */
    async getChat(chatId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('chats')
        .select('*').eq('id', chatId).maybeSingle();
      return error ? null : data;
    },

    /* Удалить чат (и его сообщения) */
    async deleteChat(chatId) {
      if (!ensureClient()) return null;
      const { error } = await SB.from('chats')
        .delete().eq('id', Number(chatId));
      return error ? null : { ok: true };
    },

    /* Найти чат по заданию и участнику */
    async findChatByTask(taskId, userId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('chats')
        .select('*').eq('task_id', Number(taskId))
        .or('user_a.eq.' + Number(userId) + ',user_b.eq.' + Number(userId))
        .limit(5);
      return error ? null : data;
    },

    /* Найти чат по заданию (без фильтра участника) */
    async findChatByTaskAny(taskId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('chats')
        .select('*').eq('task_id', Number(taskId))
        .limit(5);
      return error ? null : data;
    },

    async getMessages(chatId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(200);
      return error ? null : data;
    },

    async sendMessage(chatId, fromUser, text, fromName) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('messages')
        .insert({ chat_id: chatId, from_user: fromUser, text: text })
        .select().single();
      if (!error && data) {
        this._notifyMessageRecipient(chatId, fromUser, fromName, text);
      }
      return error ? null : data;
    },

    /* Уведомить собеседника о новом сообщении через Telegram */
    async _notifyMessageRecipient(chatId, fromUser, fromName, text) {
      try {
        const { data: chat } = await SB.from('chats').select('*').eq('id', chatId).maybeSingle();
        if (!chat) return;
        const otherId = String(chat.user_a) === String(fromUser) ? chat.user_b : chat.user_a;
        const name = fromName || 'Пользователь';
        const preview = String(text || '').slice(0, 120);
        this._notify(otherId, '✉️ Новое сообщение от <b>' + this._esc(name) + '</b>\n' + this._esc(preview));
      } catch (e) {}
    },

    async startChat(taskId, userA, userB) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('chats')
        .upsert({ task_id: taskId, user_a: userA, user_b: userB },
          { onConflict: 'task_id,user_a,user_b' })
        .select().single();
      return error ? null : data;
    },

    /* Отправка сообщения в диалог по заданию: находит чат и шлёт текст */
    async sendMessageToTask(taskId, userId, text, fromName) {
      if (!ensureClient()) return null;
      const { data: chat, error: e1 } = await SB.from('chats')
        .select('id').eq('task_id', taskId).limit(5);
      if (e1 || !chat || !chat.length) return null;
      /* берём чат, где пользователь участник */
      const mine = chat.filter(c =>
        String(c.user_a) === String(userId) || String(c.user_b) === String(userId));
      if (!mine.length) return null;
      return await this.sendMessage(mine[0].id, userId, text, fromName);
    },

    /* ---------- Realtime ---------- */
    subscribeChats(callback) {
      if (!ensureClient()) return null;
      return SB
        .channel('public:messages')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            payload => callback && callback(payload.new))
        .subscribe();
    },

    subscribeTasks(callback) {
      if (!ensureClient()) return null;
      return SB
        .channel('public:tasks')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'tasks' },
            payload => callback && callback(payload.new))
        .subscribe();
    }
  };
})();