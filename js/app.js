/* ============================================================
   Yumitask — ядро приложения (init, Telegram WebApp, роутер)
   Экраны определены в js/screens.js (регистрируются через TaskPay.register)
   ============================================================ */
(function () {
  'use strict';

  const app = document.getElementById('app');
  let tg = null;
  let currentRoute = null;
  let routeState = {};
  let filters = { cat: 'all', platform: 'all', sort: 'new' };

  try {
    if (window.Telegram && window.Telegram.WebApp) {
      tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#001020');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#001020');
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }
  } catch (e) { tg = null; }

  const ADMINS = [555000111, 555000222];

  /* Номер сборки — сверяем с build.txt на сервере: если сервер свежее,
     принудительно перезагружаем приложение (лечит кеш Telegram WebView) */
  const BUILD = 75;
  (function checkBuild() {
    try {
      fetch('build.txt?t=' + Date.now())
        .then(function (r) { return r.text(); })
        .then(function (txt) {
          const remote = String(txt || '').trim();
          if (remote && remote !== String(BUILD) && !sessionStorage.getItem('buildReloaded')) {
            sessionStorage.setItem('buildReloaded', '1');
            location.reload(true);
          }
        })
        .catch(function () {});
    } catch (e) {}
  })();

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toast(msg, isErr) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' toast--err' : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2400);
  }
  function vibrate(type) {
    if (tg && tg.HapticFeedback) {
      try { tg.HapticFeedback.impactOccurred(type || 'light'); } catch (e) {}
    }
  }
  function tgUser() {
    return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
  }
  function applyTgUser() {
    const u = tgUser();
    if (!u) return;
    const me = Store.getUser();
    if (u.id && Number(u.id)) me.id = Number(u.id);
    if (u.first_name) me.name = [u.first_name, u.last_name].filter(Boolean).join(' ');
    if (u.photo_url) me.photo = u.photo_url;
    if (ADMINS.includes(me.id)) me.role = 'admin';
    Store.save();
  }
  function isAdmin() {
    const u = Store.getUser();
    return u.role === 'admin' || u.is_admin || ADMINS.includes(u.id);
  }
  /* Показываем любую скрытую JS-ошибку, чтобы её было видно (не молча ломала экран) */
  window.addEventListener('error', function (ev) {
    try {
      var msg = (ev && ev.message) || 'JS error';
      var src = (ev && ev.filename || '').split('/').pop();
      toast('⚠️ Ошибка: ' + msg + (src ? ' [' + src + ']' : ''), true);
    } catch (e) {}
  });
  function tgConfirm(title, msg, okText, cancelText) {
    /* Универсальный вызов: часть SDK возвращает Promise, часть ждёт callback.
       Передаём оба: проставляем callback, а если вернулся Promise — вешаем .then.
       Это чинит «нажимаю Да — ничего не происходит» (showConfirm падал,
       т.к. второй аргумент уходил на позицию callback, а не okText). */
    return new Promise(function (resolve) {
      if (tg && tg.showConfirm) {
        try {
          const res = tg.showConfirm(msg, function (ok) { resolve(!!ok); }, okText, cancelText);
          if (res && typeof res.then === 'function') {
            res.then(function (ok) { resolve(!!ok); }).catch(function () { resolve(false); });
          }
        } catch (e) {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }
  function tgPopup(title, msg) {
    if (tg && tg.showAlert) {
      try { return tg.showAlert(msg, title); } catch (e) {}
    }
    toast(msg);
    return Promise.resolve();
  }

  /* ---------- Роутер ---------- */
  const routes = {};
  function register(name, renderer, binder) {
    routes[name] = { render: renderer, bind: binder || function () {} };
  }
  function navigate(name, state) {
    const changed = name !== currentRoute;
    currentRoute = name;
    routeState = state || {};
    render();
    /* плавная анимация появления страницы — только при реальной смене экрана,
       иначе повторный клик на текущий экран дёргает страницу */
    try {
      if (changed) {
        app.classList.remove('anim-page');
        void app.offsetWidth; /* перезапуск анимации */
        app.classList.add('anim-page');
      }
    } catch (e) {}
    /* принудительный скролл наверх: сразу + после кадра (scroll anchoring
       может перебить одиночный scrollTo при ре-рендере списка) */
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    });
  }
  /* На какой экран ведёт «назад» с каждого экрана */
  const BACK_TO = {
    'task-detail': 'tasks',
    'my-task-detail': 'profile',
    'chat-detail': 'chats',
    'profile': 'home',
    'wallet': 'home',
    'subs': 'home',
    'create': 'home',
    'tasks': 'home',
    'home': null,
    'admin': null
  };

  function render(silent) {
    const route = routes[currentRoute] || routes.home;
    const html = route.render(routeState);
    /* бесшовный режим: если разметка не изменилась — не трогаем DOM,
       позиция скролла и картинки не прыгают */
    const same = silent && html === app.innerHTML;
    const scTop = silent ? (window.pageYOffset || document.documentElement.scrollTop || 0) : 0;
    const scLeft = silent ? (window.pageXOffset || document.documentElement.scrollLeft || 0) : 0;
    if (!same) {
      app.innerHTML = html;
    }
    route.bind(routeState);
    bindActions();
    if (tg && tg.BackButton) {
      try {
        const backTo = BACK_TO[currentRoute];
        if (!backTo) {
          tg.BackButton.hide();
        } else {
          tg.BackButton.show();
          tg.BackButton.onClick(() => navigate(backTo));
        }
      } catch (e) {}
    }
    if (silent && !same) {
      /* восстанавливаем прокрутку ПОСЛЕ отрисовки и биндов: сразу + через кадр +
         через таймаут (высота страницы стабилизируется не мгновенно) */
      const restore = () => {
        window.scrollTo(scLeft, scTop);
        if (document.documentElement) document.documentElement.scrollTop = scTop;
        if (document.body) document.body.scrollTop = scTop;
      };
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore, 60);
    }
  }

/* bindActions: только очистка прямых обработчиков.
   Клики обрабатывает ЕДИНСТВЕННЫЙ глобальный делегат в screens.js —
   иначе один тап вызывает действие дважды (прямой onclick + делегат). */
  function bindActions() {
    app.querySelectorAll('[data-action]').forEach(el => {
      el.onclick = null;
      el.ontouchend = null;
      el.ontouchstart = null;
    });
  }

  /* ---------- Общие куски интерфейса ---------- */
  const ICON_PATHS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    wallet: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M15.5 14.8h.6"/>',
    megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h2l4 5V4L6 9H4a1 1 0 0 0-1 1z"/><path d="M19 8a6 6 0 0 1 0 8"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    paperclip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICON_PATHS[name] || '') +
    '</svg>';
  }
  function topbar(title, opts) {
    opts = opts || {};
    const back = opts.back === false ? '' :
      '<button class="tb-back" data-action="back">‹</button>';
    const bal = Store.getBalance();
    const balHTML = opts.balance === false
      ? ''
      : '<button class="tb-balance" data-action="navigate" data-page="wallet" aria-label="Баланс">' +
          icon('wallet') + fmtMoney(bal) +
        '</button>';
    const ava = fabAvatarHTML();
    const headIcon = opts.icon ? icon(opts.icon, 'tb-title-icon') : '';
    return '<header class="topbar">' + back + '<h1>' + headIcon + esc(title) + '</h1>' +
      '<div class="tb-right">' + ava + balHTML + '</div>' +
    '</header>';
  }
  function bottomNav(active) {
    const tabs = [
      ['home', 'home', 'Главная'],
      ['create', 'plus', 'Разместить']
    ];
    const tabHTML = t => {
      const [name, ico, label] = t;
      return '<button class="tab' + (name === active ? ' active' : '') + '" data-action="tab" data-tab="' + name + '">' +
        '<span class="t-ico">' + icon(ico) + '</span><span>' + label + '</span></button>';
    };
    return '<div class="nav-island">' +
      '<nav class="tabbar">' +
        tabHTML(tabs[0]) +
        '<button class="tab-bourse' + (active === 'tasks' ? ' active' : '') + '" data-action="tab" data-tab="tasks" aria-label="Биржа">' +
          '<span class="tb-ico">' + icon('bolt') + '</span><span class="tb-label">Биржа</span>' +
        '</button>' +
        tabHTML(tabs[1]) +
      '</nav>' +
      '<button class="nav-chat' + (active === 'chats' || active === 'chat-detail' ? ' active' : '') + '" data-action="navigate" data-page="chats" aria-label="Сообщения">' +
        '<span class="nc-ico">' + icon('message') + '</span>' +
        '<span class="nc-badge">2</span>' +
      '</button>' +
    '</div>';
  }
  function fabAvatarHTML() {
    const u = Store.getUser();
    const photo = u.photo || ((tgUser() || {}).photo_url) || '';
    const initial = (u.name && u.name[0]) || 'Г';
    return '<button class="fab-avatar" data-action="open-profile" aria-label="Профиль">' +
      (photo
        ? '<img src="' + esc(photo) + '" alt="аватар">'
        : '<span class="fa-initial">' + esc(initial) + '</span>') +
    '</button>';
  }
  function statCard(val, label, cls) {
    return '<div class="stat-card ' + (cls || '') + '"><div class="val">' + val + '</div><div class="label">' + esc(label) + '</div></div>';
  }
  function taskCardHTML(t) {
    const cat = Category.byId(t.category);
    const pl = t.platform ? Platform.byId(t.platform) : null;
    const rating = Store.getTaskEmployerRating(t);
    return '<div class="task-card" data-action="open-task" data-id="' + t.id + '">' +
      '<div class="task-card-glow"></div>' +
      '<div class="tc-title">' + esc(t.title) + '</div>' +
      '<div class="tc-meta">' +
        (pl ? '<span class="tc-meta-item">' + Platform.imgTag(pl.id, 'pl-ico') + ' ' + esc(pl.name) + '</span>' : '') +
        '<span class="tc-meta-item">' + icon('tag') + ' ' + esc(cat.name) + '</span>' +
      '</div>' +
      '<div class="tc-pay">' +
        '<span class="tc-pay-amount">' + fmtMoney(t.reward) + '</span>' +
        '<span class="tc-pay-label">за выполнение</span>' +
      '</div>' +
      '<div class="tc-bottom">' +
        '<div class="tc-info">' +
          '<span class="tc-info-item">' + icon('users') + ' <b>' + t.spotsLeft + '</b> мест</span>' +
          '<span class="tc-info-item">' + icon('clock') + ' ~' + t.durationMin + ' мин</span>' +
        '</div>' +
        '<button class="tc-do" data-action="open-task" data-id="' + t.id + '">' +
          '<span>Выполнить</span>' + icon('arrow') +
        '</button>' +
      '</div>' +
      (t.employerName ? '<div class="tc-employer">' + esc(t.employerName) + ' ' + starsHTML(rating) + ' · ' + rating.count + ' оценок</div>' : '') +
    '</div>';
  }

  function starsHTML(rating) {
    if (!rating || !rating.count) return '';
    const sc = Math.max(0, Math.min(5, rating.score || 0));
    const full = Math.round(sc);
    return '<span class="stars">' + '★'.repeat(full) + '<span class="stars-off">' + '★'.repeat(5 - full) + '</span></span>';
  }
  function proofChips(ids) {
    return ids.map(id => {
      const p = Proof.byId(id);
      const ic = { screenshot: 'camera', link: 'link', text: 'message', multiple: 'layers', other: 'paperclip' }[id] || 'paperclip';
      return '<span class="chip">' + icon(ic) + ' ' + esc(p.name) + '</span>';
    }).join('');
  }
  function statusHTML(st) {
    const map = {
      pending: ['На проверке', 'status--pending'],
      done: ['Выполнено', 'status--done'],
      rejected: ['Отклонено', 'status--rejected'],
      in_progress: ['В работе', 'status--active'],
      active: ['Активно', 'status--active']
    };
    const m = map[st] || [st, ''];
    return '<span class="status ' + m[1] + '"><span class="dot"></span>' + m[0] + '</span>';
  }

  window.TaskPay = {
    app, tg, navigate, register, esc, toast, vibrate, tgUser, applyTgUser,
    isAdmin, ADMINS, tgConfirm, tgPopup, topbar, bottomNav, fabAvatarHTML,
    icon,
    statCard, taskCardHTML, proofChips, statusHTML, starsHTML,
    currentRoute: () => currentRoute,
    routeState: () => routeState,
    filters: () => filters,
    setFilters: f => { filters = f; },
    backTo: name => BACK_TO[name] || 'home'
  };

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    Store.init();
    applyTgUser();
    if (window.TaskPayScreens) window.TaskPayScreens.init();

    /* ВСЕГДА рендерим интерфейс сразу (иначе при зависшей сети — пустой экран) */
    navigate('home');

    /* синхронизацию запускаем в фоне — она просто обновит данные, не блокируя UI */
    const syncStarted = Date.now();
    Promise.race([
      Store.useApi() ? Store.syncFromApi() : Promise.resolve(false),
      new Promise(res => setTimeout(() => res(false), 6000)) // таймаут 6с
    ]).then(ok => {
      /* после синхронизации перерисовываем, чтобы показать данные из БД */
      if (ok) {
        navigate('home');
      }
    }).catch(() => {
      /* сеть упала — остаёмся на демо-данных, интерфейс уже показан */
    });

    /* Автообновление: каждые 30 сек тянем свежие данные из БД и перерисовываем
       текущий экран (бесшовно — только если данные изменились, скролл сохраняется;
       формы не трогаем, чтобы не терять введённое) */
    setInterval(() => {
      if (!Store.useApi()) return;
      const r = currentRoute;
      /* исключаем формы и чаты: их перерисовка сбрасывает список на «Загрузка...» */
      if (r === 'create' || r === 'chat-detail' || r === 'admin' || r === 'chats') return;
      Store.syncFromApi().then(ok => {
        if (ok) render(true);
      }).catch(() => {});
    }, 30000);
  });
})();