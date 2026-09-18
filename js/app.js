/* ============================================================
   TaskPay — ядро приложения (init, Telegram WebApp, роутер)
   Экраны определены в js/screens.js (регистрируются через TaskPay.register)
   ============================================================ */
(function () {
  'use strict';

  const app = document.getElementById('app');
  let tg = null;
  let currentRoute = null;
  let routeState = {};
  let filters = { cat: 'all', sort: 'new' };

  try {
    if (window.Telegram && window.Telegram.WebApp) {
      tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#0F1233');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#0F1233');
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }
  } catch (e) { tg = null; }

  const ADMINS = [555000111, 555000222];

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
    return u.role === 'admin' || ADMINS.includes(u.id);
  }
  function tgConfirm(title, msg, okText, cancelText) {
    if (tg && tg.showConfirm) {
      try { return tg.showConfirm(msg, okText, cancelText); } catch (e) {}
    }
    return Promise.resolve(true);
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
    currentRoute = name;
    routeState = state || {};
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    const route = routes[currentRoute] || routes.home;
    app.innerHTML = route.render(routeState);
    route.bind(routeState);
    if (tg && tg.BackButton) {
      try {
        if (currentRoute === 'home' || currentRoute === 'admin') {
          tg.BackButton.hide();
        } else {
          tg.BackButton.show();
          tg.BackButton.onClick(() => navigate('home'));
        }
      } catch (e) {}
    }
  }

  /* ---------- Общие куски интерфейса ---------- */
  function topbar(title, opts) {
    opts = opts || {};
    const back = opts.back === false ? '' :
      '<button class="tb-back" data-action="back">‹</button>';
    return '<header class="topbar">' + back + '<h1>' + esc(title) + '</h1></header>';
  }
  function bottomNav(active) {
    const tabs = [
      ['home', '🏠', 'Главная'],
      ['tasks', '🔍', 'Задания'],
      ['create', '➕', 'Разместить'],
      ['wallet', '💰', 'Баланс'],
      ['profile', '👤', 'Профиль']
    ];
    return '<nav class="tabbar">' + tabs.map(t => {
      const [name, ico, label] = t;
      return '<button class="tab' + (name === active ? ' active' : '') + '" data-action="tab" data-tab="' + name + '">' +
        '<span class="t-ico">' + ico + '</span><span>' + label + '</span></button>';
    }).join('') + '</nav>';
  }
  function statCard(val, label, cls) {
    return '<div class="stat-card ' + (cls || '') + '"><div class="val">' + val + '</div><div class="label">' + esc(label) + '</div></div>';
  }
  function taskCardHTML(t) {
    const cat = Category.byId(t.category);
    return '<div class="task-card" data-action="open-task" data-id="' + t.id + '">' +
      '<div class="tc-title">' + esc(t.title) + '</div>' +
      '<div class="tc-chips">' +
        '<span class="chip">🏷 ' + esc(cat.name) + '</span>' +
        '<span class="chip chip--green">💰 ' + fmtMoney(t.reward) + '</span>' +
        '<span class="chip chip--amber">👥 Осталось: ' + t.spotsLeft + '</span>' +
      '</div>' +
      '<div class="tc-footer">' +
        '<span>⏱ около ' + t.durationMin + ' мин</span>' +
        '<span class="chip--blue" style="color:var(--blue);font-weight:700;">Выполнить →</span>' +
      '</div>' +
    '</div>';
  }
  function proofChips(ids) {
    return ids.map(id => {
      const p = Proof.byId(id);
      const icon = { screenshot: '📸', link: '🔗', text: '💬', multiple: '🗂', other: '📎' }[id] || '📎';
      return '<span class="chip">' + icon + ' ' + esc(p.name) + '</span>';
    }).join('');
  }
  function statusHTML(st) {
    const map = {
      pending: ['🟡 На проверке', 'status--pending'],
      done: ['🟢 Выполнено', 'status--done'],
      rejected: ['🔴 Отклонено', 'status--rejected'],
      in_progress: ['🟦 В работе', 'status--active'],
      active: ['🟢 Активно', 'status--active']
    };
    const m = map[st] || [st, ''];
    return '<span class="status ' + m[1] + '">' + m[0] + '</span>';
  }

  window.TaskPay = {
    app, tg, navigate, register, esc, toast, vibrate, tgUser, applyTgUser,
    isAdmin, ADMINS, tgConfirm, tgPopup, topbar, bottomNav, statCard,
    taskCardHTML, proofChips, statusHTML,
    currentRoute: () => currentRoute,
    routeState: () => routeState,
    filters: () => filters,
    setFilters: f => { filters = f; }
  };

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    Store.init();
    applyTgUser();
    if (window.TaskPayScreens) window.TaskPayScreens.init();
    navigate('home');
  });
})();