/* ============================================================
   Yumitask — слой интеграции с Supabase (API + realtime)
   Подключение: index.html → <script src="js/api.js">
   Перед использованием укажите свои ключи внизу файла:
   - SUPABASE_URL (https://xxxx.supabase.co)
   - SUPABASE_ANON_KEY (public anon key из Dashboard → Settings → API)
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://ВАШ-ПРОЕКТ.supabase.co';   // замените
  var SUPABASE_ANON_KEY = 'eyJ...ваш_anon_ключ';         // замените

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
      return configured && SUPABASE_URL.indexOf('ВАШ-ПРОЕКТ') === -1 &&
             SUPABASE_ANON_KEY.indexOf('eyJ...') === -1;
    },

    /* ---------- Авторизация по initData (непосредственно через таблицу users) ---------- */
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