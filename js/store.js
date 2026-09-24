/* ============================================================
   Yumitask — хранилище данных
   Локальная модель (localStorage) для прототипа мини-приложения.
   В продакшене заменяется на API бэкенда.
   ============================================================ */

const CATEGORIES = [
  { id: 'reviews', name: 'Отзывы', icon: '⭐' },
  { id: 'social', name: 'Социальные сети', icon: '📱' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'subs', name: 'Подписки', icon: '🔔' },
  { id: 'likes', name: 'Лайки', icon: '❤️' },
  { id: 'views', name: 'Просмотры', icon: '👁' },
  { id: 'comments', name: 'Комментарии', icon: '💬' },
  { id: 'other', name: 'Другое', icon: '📦' }
];

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', img: 'icons_svg/tiktok.svg' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', img: 'icons_svg/telegram.svg' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', img: 'icons_svg/icon_05.svg' },
  { id: 'vk', name: 'VK', icon: '🟦', img: 'icons_svg/vk.svg' },
  { id: 'instagram', name: 'Instagram', icon: '📸', img: 'icons_svg/icon_14.svg' },
  { id: 'avito', name: 'Авито', icon: '🛒', img: 'icons_svg/avito.svg' },
  { id: '2gis', name: '2GIS', icon: '🗺', img: 'icons_svg/2gis.svg' },
  { id: 'yandex_maps', name: 'Яндекс Карты', icon: '📍', img: 'icons_svg/Яндекс карты.svg' },
  { id: 'google_maps', name: 'Google Карты', icon: '🌍', img: 'icons_svg/google maps.svg' },
  { id: 'website', name: 'Сайт / другое', icon: '🌐', img: 'icons_svg/icon_08.svg' }
];

const PROOF_TYPES = [
  { id: 'screenshot', name: 'Скриншот' },
  { id: 'link', name: 'Ссылка' },
  { id: 'text', name: 'Текстовый ответ' },
  { id: 'multiple', name: 'Несколько вариантов' },
  { id: 'other', name: 'Другое' }
];

const TASK_STATUS = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  DONE: 'done',
  REJECTED: 'rejected'
};

const SUBSCRIPTIONS = [
  { id: 'week', days: 7,   price: 500,  name: 'Неделя',     desc: 'Размещение заданий на 7 дней.', hot: false },
  { id: 'month', days: 30, price: 2000, name: 'Месяц',      desc: 'Размещение заданий на 30 дней.', hot: true },
  { id: 'quarter', days: 90, price: 5000, name: '3 месяца',  desc: 'Размещение заданий на 90 дней.', hot: false }
];

const STORAGE_KEY = 'taskpay_data_v1';

/* ---------- Начальные данные (демо) ---------- */
function seedData() {
  const now = Date.now();
  const day = 86400000;
  return {
    user: {
      id: 0,
      name: 'Гость',
      role: 'both',               // 'employer' | 'worker' | 'both'
      balance: 1250,
      is_admin: false,            // администратор платформы
      is_blocked: false,          // заблокирован
      can_post_unlimited: false,  // админ снял ограничение на число заданий
      is_verified: false,      // галочка верификации
      referred_by: null,       // кто пригласил (id)
      referred_bonus: false,   // бонус за реферала уже начислен
      subscribed_categories: [],  // категории для уведомлений
      promo_used: [],             // id использованных промокодов
      subscription: null,         // { planId, until }
      rating: { worker: { score: 0, count: 0 }, employer: { score: 0, count: 0 } },
      completedTasks: 0,
      createdAt: now
    },
    tasks: [
      {
        id: 1,
        title: 'Напишите отзыв о нашем ресторане',
        description: 'Посетите страницу ресторана, ознакомьтесь с информацией и выполните указанное действие.',
        category: 'reviews',
        reward: 100,
        spotsTotal: 100,
        spotsLeft: 37,
        durationMin: 5,
        instruction: '1. Откройте страницу ресторана по ссылке в задании.\n2. Ознакомьтесь с меню и атмосферой.\n3. Напишите честный отзыв (от 3 предложений) о посещении.\n4. Прикрепите скриншот опубликованного отзыва.',
        proof: ['screenshot', 'text'],
        platform: 'website',
        employerId: -1,
        employerName: 'Ресторан «Уют»',
        employerRating: { score: 4.7, count: 32 },
        createdAt: now - 2 * day,
        deadlineDays: 7,
        status: TASK_STATUS.ACTIVE
      },
      {
        id: 2,
        title: 'Подпишитесь на Telegram-канал',
        description: 'Подпишитесь на канал и оставайтесь подписанным 3 дня.',
        category: 'telegram',
        reward: 50,
        spotsTotal: 200,
        spotsLeft: 143,
        durationMin: 3,
        instruction: '1. Перейдите по ссылке на канал.\n2. Нажмите «Подписаться».\n3. Оставайтесь подписанным минимум 3 дня.\n4. Прикрепите скриншот подписки.',
        proof: ['screenshot'],
        platform: 'telegram',
        employerId: -1,
        employerName: 'Startup News',
        employerRating: { score: 4.5, count: 18 },
        createdAt: now - 5 * day,
        deadlineDays: 3,
        status: TASK_STATUS.ACTIVE
      },
      {
        id: 3,
        title: 'Поставьте лайк посту в VK',
        description: 'Поставьте лайк и сделайте репост записи.',
        category: 'social',
        reward: 30,
        spotsTotal: 500,
        spotsLeft: 402,
        durationMin: 2,
        instruction: '1. Откройте запись по ссылке.\n2. Поставьте лайк.\n3. Сделайте репост к себе на страницу.\n4. Пришлите ссылку на репост.',
        proof: ['link', 'screenshot'],
        platform: 'vk',
        employerId: -1,
        employerName: 'Brand Shop',
        employerRating: { score: 4.2, count: 25 },
        createdAt: now - day,
        deadlineDays: 5,
        status: TASK_STATUS.ACTIVE
      },
      {
        id: 4,
        title: 'Оставьте комментарий под видео',
        description: 'Напишите содержательный комментарий под видео и закрепите его.',
        category: 'comments',
        reward: 45,
        spotsTotal: 80,
        spotsLeft: 66,
        durationMin: 4,
        instruction: '1. Посмотрите видео до конца.\n2. Напишите развёрнутый комментарий (от 2 предложений).\n3. Прикрепите скриншот комментария.',
        proof: ['screenshot'],
        platform: 'youtube',
        employerId: -1,
        employerName: 'VideoBlog',
        createdAt: now - 12 * 3600000,
        deadlineDays: 4,
        status: TASK_STATUS.ACTIVE
      },
      {
        id: 5,
        title: 'Подписка на YouTube-канал',
        description: 'Подпишитесь на канал и включите уведомления.',
        category: 'subs',
        reward: 60,
        spotsTotal: 120,
        spotsLeft: 95,
        durationMin: 3,
        instruction: '1. Перейдите на канал по ссылке.\n2. Нажмите «Подписаться» и включите колокольчик.\n3. Прикрепите скриншот подписки.',
        proof: ['screenshot'],
        platform: 'youtube',
        employerId: -1,
        employerName: 'TechTube',
        createdAt: now - 3 * day,
        deadlineDays: 7,
        status: TASK_STATUS.ACTIVE
      },
      {
        id: 6,
        title: 'Напишите отзыв о мобильном приложении',
        description: 'Установите приложение, попробуйте его и оставьте отзыв в сторе.',
        category: 'reviews',
        reward: 150,
        spotsTotal: 60,
        spotsLeft: 51,
        durationMin: 8,
        instruction: '1. Установите приложение по ссылке.\n2. Изучите основные функции.\n3. Оставьте отзыв в сторе (от 150 символов).\n4. Прикрепите скриншот отзыва.',
        proof: ['screenshot', 'text'],
        platform: 'website',
        employerId: -1,
        employerName: 'AppLab',
        createdAt: now - 7 * 3600000,
        deadlineDays: 10,
        status: TASK_STATUS.ACTIVE
      }
    ],
    assignments: [],
    transactions: [
      { id: 't1', type: 'income', amount: 100, title: 'Выполнение задания', date: now - 2 * day },
      { id: 't2', type: 'income', amount: 250, title: 'Выполнение задания', date: now - 4 * day },
      { id: 't3', type: 'expense', amount: 200, title: 'Продвижение Telegram-канала', date: now - 5 * day }
    ],
    employersCount: 128,
    earningsTotal: 482500
  };
}

/* ---------- Хранилище ---------- */
const Store = {
  data: null,

  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
      }
    } catch (e) { /* повреждённые данные — пересоздаём */ }
    if (!this.data) {
      this.data = seedData();
      this.save();
    }
  },

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) {}
  },

  reset() {
    this.data = seedData();
    this.save();
  },

  nextId(listKey) {
    const arr = this.data[listKey] || [];
    return arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  },

  /* ---------- Пользователь ---------- */
  getUser() { return this.data.user; },

  setUserName(name) {
    this.data.user.name = name && name.trim() ? name.trim() : 'Гость';
    this.save();
  },

  setUid(uid) {
    this.data.user.uid = uid;
    this.save();
  },

  setRole(role) {
    this.data.user.role = role;
    this.save();
  },

  /* ---------- Задания ---------- */
  getTasks() { return this.data.tasks; },

  getTask(id) { return this.data.tasks.find(t => t.id === Number(id)); },

  addTask(task) {
    task.id = this.nextId('tasks');
    task.spotsLeft = task.spotsTotal;
    task.createdAt = Date.now();
    task.status = TASK_STATUS.ACTIVE;
    this.data.tasks.unshift(task);
    this.save();
    return task;
  },

  /* ---------- Назначения (взятые задания) ---------- */
  getAssignments() { return this.data.assignments; },

  getAssignment(id) { return this.data.assignments.find(a => a.id === Number(id)); },

  addAssignment(a) {
    this.data.assignments.push(a);
    this.save();
  },

  updateAssignment(id, patch) {
    const a = this.getAssignment(id);
    if (!a) return null;
    Object.assign(a, patch);
    this.save();
    return a;
  },

  /* ---------- Баланс ---------- */
  getBalance() { return this.data.user.balance; },

  addTransaction(type, amount, title) {
    const t = {
      id: 't' + (this.data.transactions.length + 1) + '_' + Date.now(),
      type, amount, title, date: Date.now()
    };
    this.data.transactions.unshift(t);
    return t;
  },

  changeBalance(delta, type, title) {
    this.data.user.balance = Math.max(0, Math.round((this.data.user.balance + delta) * 100) / 100);
    this.addTransaction(type, Math.abs(delta), title);
    this.save();
  },

  /* ---------- Подписки ---------- */
  getSubscription() { return this.data.user.subscription; },

  hasActiveSubscription() {
    const s = this.data.user.subscription;
    return !!s && s.until > Date.now();
  },

  activateSubscription(planId) {
    const plan = SUBSCRIPTIONS.find(p => p.id === planId);
    if (!plan) return { ok: false, error: 'Тариф не найден' };
    if (this.data.user.balance < plan.price) return { ok: false, error: 'Недостаточно средств' };
    const cur = this.data.user.subscription;
    const base = (cur && cur.until > Date.now()) ? cur.until : Date.now();
    this.data.user.subscription = { planId: plan.id, until: base + plan.days * 86400000 };
    this.changeBalance(-plan.price, 'expense', `Подписка работодателя — ${plan.name}`);
    this.setRole('employer');
    this.save();
    return { ok: true, plan };
  },

  /* ---------- Рейтинги ---------- */
  getUserRating(kind) {
    const r = this.data.user.rating || {};
    const v = r[kind] || {};
    /* нормализуем — старый localStorage мог хранить score: null */
    return {
      score: Number(v.score) || 0,
      count: Number(v.count) || 0
    };
  },

  addRating(kind, stars) {
    const r = this.data.user.rating || {};
    r[kind] = r[kind] || { score: 0, count: 0 };
    const cur = r[kind];
    const total = cur.score * cur.count + stars;
    cur.count += 1;
    cur.score = Math.round((total / cur.count) * 10) / 10;
    this.save();
    return cur;
  },

  getTaskEmployerRating(task) {
    if (task.employerRating) return task.employerRating;
    return { score: 5, count: 1 };
  },

  /* ---------- Статистика ---------- */
  computeStats() {
    const tasks = this.data.tasks;
    const active = tasks.filter(t => t.status === TASK_STATUS.ACTIVE).length;
    const done = this.data.assignments.filter(a => a.status === TASK_STATUS.DONE).length;
    return {
      activeTasks: active,
      doneTasks: done,
      earned: this.data.earningsTotal,
      employers: this.data.employersCount
    };
  },

  /* ============================================================
     СИНХРОНИЗАЦИЯ С SUPABASE
     Если ключи api.js не настроены — эти методы просто возвращают
     текущие данные (демо-режим, localStorage).
  ============================================================ */
  useApi() {
    return !!(window.Api && window.Api.isConfigured());
  },

  async syncFromApi() {
    if (!this.useApi()) return false;
    try {
      /* ЗАПУСК: напрямую через таблицу users (MVP-политики 'for all using true')
         — edge-функция auth будет включена после стабилизации */
      const user = await Api.ensureUser();
      if (user) {
        this.data.user.id = Number(user.id);
        this.data.user.name = user.name || this.data.user.name;
        this.data.user.balance = user.balance != null ? user.balance : this.data.user.balance;
        this.data.user.role = user.role || this.data.user.role;
        if (user.uid) this.data.user.uid = user.uid;
        if (user.is_admin != null) this.data.user.is_admin = !!user.is_admin;
        if (user.is_blocked != null) this.data.user.is_blocked = !!user.is_blocked;
        if (user.can_post_unlimited != null) this.data.user.can_post_unlimited = !!user.can_post_unlimited;
        if (user.is_verified != null) this.data.user.is_verified = !!user.is_verified;
        if (user.referred_by != null) this.data.user.referred_by = user.referred_by;
        if (user.referred_bonus != null) this.data.user.referred_bonus = !!user.referred_bonus;
        if (user.subscribed_categories != null) this.data.user.subscribed_categories = Array.isArray(user.subscribed_categories) ? user.subscribed_categories.slice() : [];
        if (user.promo_used != null) this.data.user.promo_used = Array.isArray(user.promo_used) ? user.promo_used.slice() : [];
      }
      /* свежий баланс из БД */
      const bal = await Api.getBalance(this.data.user.id);
      if (bal != null) this.data.user.balance = bal;

      /* UID пользователя */
      const myUid = await Api.getMyUid(this.data.user.id);
      if (myUid) this.data.user.uid = myUid;

      const tasks = await Api.getTasks();
      if (Array.isArray(tasks)) {
        /* заменяем локальный список ВСЕГДА, даже если база вернула пустой список —
           иначе старые демо-задания из localStorage остаются навсегда */
        this.data.tasks = tasks.map(t => ({
          id: Number(t.id),
          title: t.title,
          description: t.description || '',
          category: t.category || 'other',
          platform: t.platform || 'website',
          reward: t.reward || 0,
          spotsTotal: t.spots_total || 1,
          spotsLeft: t.spots_left || 0,
          durationMin: t.duration_min || 5,
          instruction: t.instruction || '',
          proof: t.proof || ['screenshot'],
          employerId: Number(t.employer_id),
          employerName: t.employer_name || '',
          deadlineDays: t.deadline_days || 7,
          createdAt: new Date(t.created_at || Date.now()).getTime(),
          status: TASK_STATUS.ACTIVE
        }));
      }

      /* мои отклики из БД — чтобы «Мои задания» и страница подтверждения работали */
      const myAssignments = await Api.getMyAssignments(Number(this.data.user.id));
      if (Array.isArray(myAssignments)) {
        this.data.assignments = myAssignments.map(a => ({
          id: Number(a.id),
          taskId: Number(a.task_id),
          userId: Number(a.user_id),
          userName: a.user_name || '',
          status: a.status || 'in_progress',
          reward: a.reward || 0,
          takenAt: new Date(a.created_at || Date.now()).getTime(),
          proofType: a.proof_type || null,
          proofData: a.comment || null,
          rejectionReason: a.rejection_reason || null,
          rated: !!a.rated
        }));
      }

      this.save();
      return true;
    } catch (e) {
      console.error('syncFromApi error', e);
      return false;
    }
  },

  async publishToApi(task) {
    if (!this.useApi()) return null;
    try {
      return await Api.publishTask({
        title: task.title,
        description: task.description,
        category: task.category,
        platform: task.platform,
        reward: task.reward,
        spots_total: task.spotsTotal,
        spots_left: task.spotsLeft,
        duration_min: task.durationMin || 10,
        instruction: task.instruction,
        proof: task.proof,
        employer_id: task.employerId,
        employer_name: task.employerName,
        deadline_days: task.deadlineDays || 7,
        status: 'active'
      });
    } catch (e) {
      console.error('publishToApi error', e);
      return null;
    }
  }
};

/* ---------- Соцсеть-хелперы ---------- */
const Category = {
  byId(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]; },
  name(id) { return this.byId(id).name; },
  icon(id) { return this.byId(id).icon; }
};

const Platform = {
  list: PLATFORMS,
  byId(id) { return PLATFORMS.find(p => p.id === id) || PLATFORMS[PLATFORMS.length - 1]; },
  name(id) { return this.byId(id).name; },
  icon(id) { return this.byId(id).icon; },
  imgTag(id, cls) {
    const p = this.byId(id);
    if (!p.img) return p.icon || '';
    return '<img src="' + p.img + '" alt="' + p.name + '" class="pl-icon ' + (cls || '') + '">';
  }
};

const Proof = {
  byId(id) { return PROOF_TYPES.find(p => p.id === id) || { id, name: id }; },
  names(ids) { return ids.map(id => this.byId(id).name); }
};

function fmtMoney(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' мин назад';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' ч назад';
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  return d + ' дн назад';
}

/* Инициализация при загрузке */
Store.init();