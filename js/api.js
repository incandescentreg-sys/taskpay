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

    async publishTask(task) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('tasks').insert(task).select().single();
      return error ? null : data;
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
      return data;
    },

    async getAssignmentsForTask(taskId, employerId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .select('*').eq('task_id', taskId);
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

    /* ---------- Подтверждение/отклонение выполнения (edge-функция) ---------- */
    async confirmAssignment(assignmentId, employerId) {
      return this._callEdge('complete-assignment', {
        assignment_id: Number(assignmentId), user_id: Number(employerId)
      });
    },

    async rejectAssignment(assignmentId, employerId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('assignments')
        .update({ status: 'rejected', rejection_reason: 'Отклонено работодателем' })
        .eq('id', assignmentId)
        .select().single();
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

    /* Создать/найти чат с пользователем (без задания) */
    async findOrCreateChat(userA, userB) {
      if (!ensureClient()) return null;
      const a = Number(userA), b = Number(userB);
      if (a === b) return null;
      /* ищем существующий чат в обе стороны */
      const { data: existing } = await SB.from('chats')
        .select('*')
        .or('and(user_a.eq.' + a + ',user_b.eq.' + b + '),and(user_a.eq.' + b + ',user_b.eq.' + a + ')')
        .maybeSingle();
      if (existing) return existing;
      const { data, error } = await SB.from('chats')
        .insert({ user_a: a, user_b: b })
        .select().single();
      return error ? null : data;
    },

    async requestPayout(userId, amount) {
      return this._callRpc('request_payout', {
        p_user_id: Number(userId), p_amount: Number(amount)
      });
    },

    /* ---------- Внутренние хелперы ---------- */
    async _callEdge(fn, body) {
      if (!ensureClient()) return null;
      try {
        const res = await fetch(SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/' + fn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        });
        return await res.json();
      } catch (e) {
        console.error(fn + ' error', e);
        return null;
      }
    },

    async _callRpc(fn, params) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.rpc(fn, params);
      return error ? { error: error.message } : data;
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

    async getMessages(chatId) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(200);
      return error ? null : data;
    },

    async sendMessage(chatId, fromUser, text) {
      if (!ensureClient()) return null;
      const { data, error } = await SB.from('messages')
        .insert({ chat_id: chatId, from_user: fromUser, text: text })
        .select().single();
      return error ? null : data;
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
    async sendMessageToTask(taskId, userId, text) {
      if (!ensureClient()) return null;
      const { data: chat, error: e1 } = await SB.from('chats')
        .select('id').eq('task_id', taskId).limit(5);
      if (e1 || !chat || !chat.length) return null;
      /* берём чат, где пользователь участник */
      const mine = chat.filter(c =>
        String(c.user_a) === String(userId) || String(c.user_b) === String(userId));
      if (!mine.length) return null;
      return await this.sendMessage(mine[0].id, userId, text);
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