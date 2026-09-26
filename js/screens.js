/* ============================================================
   Yumitask — все экраны приложения
   Каждый экран — функция, зарегистрированная через TaskPay.register
   ============================================================ */
(function () {
  'use strict';

  const { navigate, register, topbar, bottomNav, statCard, taskCardHTML,
    proofChips, statusHTML, starsHTML, esc, toast, vibrate, tgConfirm, tgPopup,
    isAdmin, filters: getFilters, setFilters: setFtrs } = TaskPay;

  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const qq = sel => document.querySelectorAll(sel);

  /* ================================================================
     HOME — главный экран
  ================================================================ */
  register('home', () => {
    const u = Store.getUser();
    const stats = Store.computeStats();
    const nearZero = Store.getBalance() < 5;
    const hasSub = Store.hasActiveSubscription();

    return `
    <div class="page page--hero">
      <div class="ver-tag">build 70</div>
      <div class="home-top-right">
        <button class="home-balance" data-action="refresh-data" aria-label="Обновить" style="min-width:42px">${TaskPay.icon('refresh')}</button>
        <button class="home-balance" data-action="navigate" data-page="wallet" aria-label="Баланс">${TaskPay.icon('wallet')} ${fmtMoney(Store.getBalance())}</button>
        ${TaskPay.fabAvatarHTML()}
      </div>
      <div class="brand">
        <img src="banner.jpg" alt="Yumitask" class="banner-logo">
        <div class="tagline">Выполняй задания — получай деньги<br>Размещай задания — получай результат</div>
      </div>

      <div class="bourse-wrap">
        <button class="bourse-btn" data-action="navigate" data-page="tasks">
          <span class="bb-ico">${TaskPay.icon('bolt')}</span>
          <span><span class="bb-label">Биржа заданий</span><span class="bb-sub">Открыть задания</span></span>
        </button>
      </div>

      <div class="grid-menu">
        <button type="button" class="menu-card" data-action="navigate" data-page="create">
          <div class="mc-ico" style="background:var(--blue-soft)">${TaskPay.icon('briefcase')}</div>
          <div class="mc-label">Разместить задание</div>
          <div class="mc-sub">Найди исполнителей</div>
          <div class="wave-row wave-1"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-2"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-3"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
        </button>
        <button type="button" class="menu-card menu-card--amber" data-action="navigate" data-page="subs">
          <div class="mc-ico" style="background:var(--amber-soft)">${TaskPay.icon('megaphone')}</div>
          <div class="mc-label">Продвижение</div>
          <div class="mc-sub">Тарифы работодателя</div>
          <div class="wave-row wave-1"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-2"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-3"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
        </button>
        <button type="button" class="menu-card menu-card--green" data-action="open-support">
          <div class="mc-ico" style="background:var(--green-soft)">${TaskPay.icon('message')}</div>
          <div class="mc-label">Служба поддержки</div>
          <div class="mc-sub">Связаться с нами</div>
          <div class="wave-row wave-1"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-2"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-3"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
        </button>
        ${isAdmin() ? `
        <button type="button" class="menu-card menu-card--amber" data-action="navigate" data-page="admin">
          <div class="mc-ico" style="background:var(--red-soft)">${TaskPay.icon('shield')}</div>
          <div class="mc-label">Админ-панель</div>
          <div class="mc-sub">Управление</div>
          <div class="wave-row wave-1"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-2"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
          <div class="wave-row wave-3"><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg><svg viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0,120 C360,16 520,16 720,120 C920,224 1080,224 1440,120 L1440,320 L0,320 Z"/></svg></div>
        </button>` : ''}
      </div>

      <div class="section-title">Статистика платформы</div>
      <div class="stats">
        ${statCard(stats.activeTasks, 'Активных заданий', 'green')}
        ${statCard(stats.doneTasks, 'Выполнено заданий', 'blue')}
      </div>

      <div class="section-title">${TaskPay.icon('star')} Топ исполнителей недели</div>
      <div id="top-week"><div class="empty small" style="padding:16px">Загрузка...</div></div>

      ${!hasSub ? `
      <div class="cta-banner">
        <div class="cb-title">🚀 Хотите привлечь клиентов, подписчиков или получить отзывы?</div>
        <div class="cb-text">Разместите своё задание и получите реальных исполнителей.</div>
        <button class="btn btn--block" data-action="navigate" data-page="subs">Стать работодателем</button>
      </div>` : ''}

      <div class="footer-links footer-links--cols">
        <a href="https://telegra.ph/POLITIKA-KONFIDENCIALNOSTI-08-12-99" target="_blank" rel="noopener">Политика конфиденциальности</a>
        <a href="https://telegra.ph/PUBLICHNAYA-OFERTA-08-12-15" target="_blank" rel="noopener">Пользовательское соглашение</a>
      </div>

      ${bottomNav('home')}
    </div>`;
  }, () => {
    /* топ исполнителей недели */
    if (Store.useApi() && window.Api && Api.getTopUsers) {
      Api.getTopUsers().then(function (rows) {
        const box = q('#top-week');
        if (!box) return;
        if (!rows || !rows.length) {
          box.innerHTML = '<div class="empty small" style="padding:16px">Пока нет выполненных заданий за неделю</div>';
          return;
        }
        box.innerHTML = rows.map(function (u, i) {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
          return '<div class="card" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px">' +
            '<span style="font-size:18px;font-weight:800;min-width:26px">' + medal + '</span>' +
            '<span style="flex:1;min-width:0;font-weight:600">' + esc(u.name || 'Исполнитель') + '</span>' +
            '<span style="font-size:12px;color:var(--text-3)">' + u.count + ' вып.</span>' +
            '<span style="font-weight:800;color:var(--green)">+' + fmtMoney(u.sum) + '</span>' +
          '</div>';
        }).join('');
      }).catch(function () {
        const box = q('#top-week');
        if (box) box.innerHTML = '<div class="empty small" style="padding:16px">Ошибка загрузки</div>';
      });
    }
  });

  /* ================================================================
     TASKS — найти задания
  ================================================================ */
  register('tasks', () => {
    let { cat, platform, sort } = TaskPay.filters();
    let tasks = Store.getTasks().filter(t => t.status === 'active' && t.spotsLeft > 0);

    if (cat !== 'all') tasks = tasks.filter(t => t.category === cat);
    if (platform !== 'all') tasks = tasks.filter(t => t.platform === platform);
    if (sort === 'pay') tasks.sort((a, b) => b.reward - a.reward);
    else if (sort === 'popular') tasks.sort((a, b) => b.spotsTotal - a.spotsTotal);
    else tasks.sort((a, b) => b.createdAt - a.createdAt);

    const catHTML = (id, name) =>
      '<button type="button" class="tag' + (cat === id ? ' active' : '') + '" data-action="filter-cat" data-cat="' + id + '">' + name + '</button>';
    const platHTML = (id, name) =>
      '<button type="button" class="tag' + (platform === id ? ' active' : '') + '" data-action="filter-platform" data-platform="' + id + '">' + name + '</button>';
    const sortHTML = (id, name) =>
      '<button type="button" class="tag' + (sort === id ? ' active' : '') + '" data-action="filter-sort" data-sort="' + id + '">' + name + '</button>';

    return `
    ${topbar('Найти задания', { back: false, icon: 'search' })}
    <div class="page">
      <div class="section-title">Платформа</div>
      <div class="tag-row">${platHTML('all', 'Все')}${PLATFORMS.map(p => platHTML(p.id, Platform.imgTag(p.id, 'tag-ico') + ' ' + p.name)).join('')}</div>
      <div class="section-title">Категории</div>
      <div class="tag-row">${catHTML('all', 'Все')}${CATEGORIES.map(c => catHTML(c.id, c.icon + ' ' + c.name)).join('')}</div>
      <div class="section-title">Сортировка <span class="link" data-action="refresh-data">${TaskPay.icon('refresh')} Обновить</span></div>
      <div class="tag-row">${['new','pay','popular'].map(s => {
        const names = { new: 'Новые', pay: 'По оплате', popular: 'Популярные' };
        const icSort = { new: 'star', pay: 'cash', popular: 'bolt' };
        return sortHTML(s, '<span class="sort-ico">' + TaskPay.icon(icSort[s]) + '</span>' + names[s]);
      }).join('')}</div>
      ${tasks.length === 0 ? '<div class="empty"><div class="e-ico">' + TaskPay.icon('inbox') + '</div><div class="e-title">Нет доступных заданий</div><div class="e-sub">Скоро появятся новые задачи</div></div>' :
        tasks.map(t => taskCardHTML(t)).join('')}
    </div>
    ${bottomNav('tasks')}`;
  }, () => {
    /* после перерисовки держим активный фильтр в зоне видимости ряда
       ТОЛЬКО по горизонтали — вертикаль страницы не трогаем,
       иначе автообновление бросало бы к началу списка */
    const rows = qq('.tag-row');
    rows.forEach(function (row) {
      const active = row.querySelector('.tag.active');
      if (active) {
        const left = active.offsetLeft - (row.clientWidth / 2) + (active.clientWidth / 2);
        if (left > row.scrollLeft && left < row.scrollLeft + row.clientWidth) {
          /* уже видно — не двигаем */
        } else {
          const target = Math.max(0, Math.min(left, row.scrollWidth - row.clientWidth));
          row.scrollLeft = target;
        }
      }
    });
  });

  /* ================================================================
     TASK DETAIL — страница одного задания
  ================================================================ */
  register('task-detail', (s) => {
    const t = Store.getTask(s.id);
    if (!t) return '<div class="page"><div class="empty"><div class="e-ico">' + TaskPay.icon('alert') + '</div><div class="e-title">Задание не найдено</div></div></div>';
    const cat = Category.byId(t.category);
    const pl = t.platform ? Platform.byId(t.platform) : null;
    const rating = Store.getTaskEmployerRating(t);
    return `
    ${topbar(t.title)}
    <div class="page">
      <div class="card" style="margin-bottom:16px;">
        <div class="section-title" style="margin-top:0">${esc(t.title)}</div>
        <div class="tc-chips" style="margin-bottom:12px">
          ${pl ? '<span class="chip chip--blue">' + Platform.imgTag(pl.id, 'chip-ico') + ' ' + esc(pl.name) + '</span>' : ''}
          <span class="chip chip--accent">${TaskPay.icon('tag')} ${esc(cat.name)}</span>
          <span class="chip chip--green">${TaskPay.icon('cash')} ${fmtMoney(t.reward)} за исполнителя</span>
          <span class="chip chip--amber">${TaskPay.icon('users')} Осталось: ${t.spotsLeft} мест</span>
          <span class="chip chip--blue">${TaskPay.icon('clock')} ~${t.durationMin} мин</span>
          ${function () {
            const myAsn = Store.getAssignments().filter(a => a.taskId === t.id && String(a.userId) === String(Store.getUser().id));
            if (!myAsn.length) return '';
            const s = myAsn[0].status;
            const map = { in_progress: ['В обработке', '#2d8cf0'], pending: ['На модерации', '#f0ad4e'], done: ['Выполнено, оплачено', '#5cb85c'], rejected: ['Отклонено', '#d9534f'] };
            const m = map[s] || [s, '#888'];
            return '<span class="chip" style="background:' + m[1] + '20;color:' + m[1] + ';border:1px solid ' + m[1] + '40;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600">' + TaskPay.icon('star') + ' ' + m[0] + '</span>';
          }()}
        </div>
        <p style="font-size:14px;line-height:1.55;color:var(--text-2);margin:10px 0 16px">${esc(t.description)}</p>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:6px">Работодатель: ${esc(t.employerName || '—')} ${starsHTML(rating)} <b style="color:var(--accent-2)">${rating.score}</b> · ${rating.count} оценок</div>
        <div style="font-size:13px;color:var(--text-3)">Создано: ${timeAgo(t.createdAt)} · Срок: до ${t.deadlineDays} дн</div>
      </div>

      <div class="section-title">${TaskPay.icon('clipboard')} Инструкция</div>
      <div class="card">
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--text-2)">${esc(t.instruction)}</p>
      </div>

      <div class="section-title">${TaskPay.icon('paperclip')} Подтверждение выполнения</div>
      <div class="card">
        <div class="tc-chips">${proofChips(t.proof)}</div>
        <div style="font-size:13px;color:var(--text-3);margin-top:8px">Вы должны предоставить указанные доказательства.</div>
      </div>

      ${function () {
        const me = Store.getUser();
        const myAsn = Store.getAssignments().filter(a => a.taskId === t.id && String(a.userId) === String(me.id));
        if (myAsn.length) {
          const a = myAsn[0];
          const master = { in_progress: ['В работе', '#2d8cf0'], pending: ['На модерации', '#f0ad4e'], done: ['Выполнено, оплачено', '#5cb85c'], rejected: ['Отклонено', '#d9534f'] };
          const m = master[a.status] || [a.status, '#888'];
          const secondary = a.status === 'in_progress'
            ? '<button class="btn btn--block btn--green" data-action="open-my-task" data-aid="' + a.id + '" style="margin-top:0">' + TaskPay.icon('send') + ' Отправить на проверку</button>'
            : '<button class="btn btn--block" data-action="open-my-task" data-aid="' + a.id + '" style="margin-top:0">' + TaskPay.icon('clipboard') + ' Перейти к заданию</button>';
          return '<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:1px solid ' + m[1] + '40;border-radius:14px;background:' + m[1] + '18;font-weight:700;color:' + m[1] + '">' +
              TaskPay.icon('star') + ' Задание взято · ' + m[0] +
            '</div>' +
            secondary +
          '</div>';
        }
        return '<button class="btn btn--block" style="margin-top:20px" data-action="take-task" data-id="' + t.id + '">' + TaskPay.icon('download') + ' Взять задание</button>';
      }()}

      ${Store.useApi() && Number(t.employerId) !== Number(Store.getUser().id) ? `
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn--ghost btn--sm" data-action="report-task" data-id="${t.id}" data-emp="${t.employerId}" data-empname="${esc(t.employerName || '')}" style="flex:1">⚠️ Пожаловаться</button>
      </div>
      <div id="report-task-box"></div>` : ''}

      ${Store.useApi() && Number(t.employerId) === Number(Store.getUser().id) ? `
      <div class="section-title" style="margin-top:26px">${TaskPay.icon('inbox')} Отклики исполнителей</div>
      <div id="emp-assignments"><div class="empty small" style="padding:20px">Загрузка...</div></div>
      ` : ''}
    </div>
    ${bottomNav('tasks')}`;
  }, () => {
    /* если мы работодатель — подгружаем отклики */
    const tEl = q('[data-action="take-task"]');
    const taskId = tEl ? Number(tEl.dataset.id) : null;
    if (taskId && Store.useApi() && window.Api) {
      const me = Number(Store.getUser().id);
      Api.getAssignmentsForTask(taskId, me).then(function (rows) {
        const box = q('#emp-assignments');
        if (!box || !rows) return;
        if (!rows.length) {
          box.innerHTML = '<div class="empty small" style="padding:20px">Пока нет откликов</div>';
          return;
        }
        box.innerHTML = rows.map(function (r) {
          const isPending = r.status === 'pending';
          const isDone = r.status === 'done';
          return '<div class="card" style="padding:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<div><b>' + esc(r.user_name || ('Исполнитель #' + r.user_id)) + '</b>' +
              '<div style="font-size:12px;color:var(--text-3)">' + (isPending ? '🟡 На проверке' : isDone ? '🟢 Выполнено' : '🟦 В работе') + '</div></div>' +
            '</div>' +
            (r.comment ? '<div style="font-size:13px;color:var(--text-2);margin-top:8px">' + esc(r.comment) + '</div>' : '') +
            (isPending ? '<div style="display:flex;gap:8px;margin-top:12px">' +
              '<button class="btn btn--green btn--sm" data-action="confirm-assignment" data-aid="' + r.id + '">Подтвердить</button>' +
              '<button class="btn btn--red btn--sm" data-action="reject-assignment" data-aid="' + r.id + '">Отклонить</button>' +
            '</div>' : '') +
          '</div>';
        }).join('');
      });
    }
  });

  /* ================================================================
     TAKE TASK (после взятия) — с формой отправки
  ================================================================ */
  register('my-task-detail', (s) => {
    const a = Store.getAssignment(s.aid);
    if (!a) return '<div class="page"><div class="empty"><div class="e-title">Задание не найдено</div></div></div>';
    const t = Store.getTask(a.taskId);
    const cat = t ? Category.byId(t.category) : null;

    const proofIcon = id => ({ screenshot: 'camera', link: 'link', text: 'message', multiple: 'layers', other: 'paperclip' }[id] || 'paperclip');
    const proofOptsHTML = t && t.proof ? t.proof.map(p => {
      return '<label class="verify-opt" data-action="select-proof" data-proof="' + p + '">' +
        '<span class="vo-ico">' + TaskPay.icon(proofIcon(p)) + '</span>' +
        '<span class="vo-label">' + Proof.byId(p).name + '</span>' +
      '</label>';
    }).join('') : '';
    const multiHelp = a.proofType === 'text' || a.proofType === 'multiple' || a.proofType === 'other' ?
      '<div class="field"><label>Ваш ответ / ссылка</label><textarea id="proof-text" rows="3" placeholder="Вставьте ссылку или напишите ответ..."></textarea></div>' : '';

    return `
    ${topbar(t ? esc(t.title) : 'Моё задание')}
    <div class="page">
      ${a.status === 'pending' ? `
        <div class="card" style="background:var(--amber-soft);border-color:var(--amber)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${TaskPay.icon('clock', 'ico-pending')}</span>
            <div><div style="font-weight:700">На проверке</div>
            <div style="font-size:13px;color:var(--text-2)">Работодатель проверяет ваше выполнение</div></div>
          </div>
        </div>
      ` : a.status === 'done' ? `
        <div class="card" style="background:var(--green-soft);border-color:var(--green)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${TaskPay.icon('shield', 'ico-done')}</span>
            <div><div style="font-weight:700">Выполнено!</div>
            <div style="font-size:13px;color:var(--text-2)">Вознаграждение ${fmtMoney(a.reward)} зачислено на баланс</div></div>
          </div>
        </div>
        ${!a.rated ? `
        <div class="card" style="margin-top:12px">
          <div style="font-weight:700;text-align:center;margin-bottom:6px">Оцените работодателя</div>
          <div class="rate-stars">
            ${[1,2,3,4,5].map(n => '<button class="star" data-action="rate-employer" data-star="' + n + '" data-aid="' + a.id + '">★</button>').join('')}
          </div>
        </div>` : ''}
      ` : a.status === 'rejected' ? `
        <div class="card" style="background:var(--red-soft);border-color:var(--red)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${TaskPay.icon('alert', 'ico-rejected')}</span>
            <div><div style="font-weight:700">Отклонено</div>
            <div style="font-size:13px;color:var(--text-2)">${a.rejectionReason || 'Работодатель отклонил выполнение'}</div></div>
          </div>
        </div>
      ` : ''}

      ${t ? `
      <div class="card">
        <div style="font-size:13px;color:var(--text-2);margin-bottom:8px">${TaskPay.icon('clipboard')} Инструкция</div>
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--text);">${esc(t.instruction)}</p>
      </div>` : ''}

      ${a.status === 'in_progress' ? `
        <div class="section-title">${TaskPay.icon('paperclip')} Подтверждение выполнения</div>
        <div class="card">
          <div class="opt-row">${proofOptsHTML}</div>
          ${multiHelp}
          <div class="field" style="margin-top:12px">
            <label>Комментарий (необязательно)</label>
            <textarea id="proof-comment" rows="2" placeholder="Дополнительные пояснения..."></textarea>
          </div>
          <button class="btn btn--block btn--green" data-action="submit-proof" data-aid="${a.id}" style="margin-top:8px">${TaskPay.icon('send')} Отправить на проверку</button>
        </div>
      ` : ''}

      ${a.status === 'pending' ? '<div style="text-align:center;margin-top:16px"><button class="btn btn--block btn--ghost" data-action="navigate" data-page="tasks">← К заданиям</button></div>' : ''}
      ${a.status === 'rejected' ? '<div style="margin-top:16px"><button class="btn btn--block btn--red" data-action="retry-task" data-aid="' + a.id + '">Повторить задание</button></div>' : ''}
    </div>
    ${bottomNav('tasks')}`;
  }, () => {});

  /* ================================================================
     CREATE — разместить задание
  ================================================================ */
  register('create', () => {
    return `
    ${topbar('Разместить задание', { icon: 'briefcase' })}
    <div class="page">
      <div class="create-intro">
        <div class="ci-title">Создайте задание</div>
        <div class="ci-sub">Заполните шаги — и исполнители увидят вашу задачу</div>
      </div>

      <div class="form-step" style="animation-delay:.05s">
        <div class="fs-head">
          <span class="fs-num">1</span>
          <span class="fs-title">О чём задание</span>
        </div>
        <div class="field">
          <label>Название задания <span class="req">*</span></label>
          <input id="f-title" maxlength="100" placeholder="Например: Напишите отзыв о нашем ресторане">
        </div>
        <div class="field">
          <label>Описание <span class="req">*</span></label>
          <textarea id="f-desc" rows="2" placeholder="Посетите страницу ресторана, ознакомьтесь с информацией и выполните указанное действие."></textarea>
        </div>
      </div>

      <div class="form-step" style="animation-delay:.15s">
        <div class="fs-head">
          <span class="fs-num">2</span>
          <span class="fs-title">Категория и платформа</span>
        </div>
        <div class="field">
          <label>Категория <span class="req">*</span></label>
          <select id="f-cat">${CATEGORIES.map(c => '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>').join('')}</select>
        </div>
        <div class="field">
          <label>Платформа <span class="req">*</span></label>
          <select id="f-platform">${PLATFORMS.map(p => '<option value="' + p.id + '">' + p.icon + ' ' + p.name + '</option>').join('')}</select>
          <div class="hint">Где исполнитель будет выполнять задание</div>
        </div>
      </div>

      <div class="form-step" style="animation-delay:.25s">
        <div class="fs-head">
          <span class="fs-num">3</span>
          <span class="fs-title">Вознаграждение</span>
        </div>
        <div class="field">
          <label>Количество исполнителей <span class="req">*</span></label>
          <input id="f-spots" type="number" min="1" max="10000" value="100">
        </div>
        <div class="field">
          <label>Оплата за одного исполнителя (₽) <span class="req">*</span></label>
          <input id="f-reward" type="number" min="1" max="100000" value="100">
          <div class="placeholder-example">Например: <b>100 ₽</b> за человека</div>
        </div>
        <div class="budget-line" id="budget-line">
          <span>Общий бюджет</span>
          <span class="sum" id="budget-sum">10 000 ₽</span>
        </div>
      </div>

      <div class="form-step" style="animation-delay:.35s">
        <div class="fs-head">
          <span class="fs-num">4</span>
          <span class="fs-title">Инструкция исполнителю</span>
        </div>
        <div class="field">
          <textarea id="f-instruction" rows="5" placeholder="Подробно опишите, что нужно сделать и как подтвердить выполнение."></textarea>
        </div>
      </div>

      <div class="form-step" style="animation-delay:.45s">
        <div class="fs-head">
          <span class="fs-num">5</span>
          <span class="fs-title">Подтверждение и срок</span>
        </div>
        <div class="field">
          <label>Что должен предоставить исполнитель <span class="req">*</span></label>
          <div class="opt-row" id="proof-opts">${PROOF_TYPES.map(p => {
            const pi = { screenshot: 'camera', link: 'link', text: 'message', multiple: 'layers', other: 'paperclip' }[p.id] || 'paperclip';
            return '<span class="opt" data-proof="' + p.id + '">' + TaskPay.icon(pi) + ' ' + p.name + '</span>';
          }).join('')}</div>
          <div class="hint">Выберите один или несколько вариантов</div>
        </div>
        <div class="field">
          <label>Срок выполнения (дней)</label>
          <input id="f-deadline" type="number" min="1" max="365" value="7">
        </div>
      </div>

      <button class="btn btn--block btn--publish" data-action="publish-task" style="margin-top:8px">${TaskPay.icon('megaphone')} Опубликовать задание</button>
      <div class="note">После публикации задание появится в ленте исполнителей</div>
    </div>`;
  }, () => {
    /* живой расчёт бюджета */
    const spotsInput = $('f-spots');
    const rewardInput = $('f-reward');
    const budgetEl = $('budget-sum');
    function calcBudget() {
      const spots = parseInt(spotsInput.value) || 0;
      const reward = parseInt(rewardInput.value) || 0;
      budgetEl.textContent = fmtMoney(spots * reward);
    }
    if (spotsInput) spotsInput.addEventListener('input', calcBudget);
    if (rewardInput) rewardInput.addEventListener('input', calcBudget);

    /* выбор типов подтверждения */
    const opts = qq('[data-proof]');
    const selectedProofs = [];
    opts.forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.proof;
        const idx = selectedProofs.indexOf(id);
        if (idx === -1) { selectedProofs.push(id); el.classList.add('active'); }
        else { selectedProofs.splice(idx, 1); el.classList.remove('active'); }
      });
    });
  });

  /* ================================================================
     SUBSCRIPTIONS — тарифы для работодателей
  ================================================================ */
  register('subs', () => {
    const hasSub = Store.hasActiveSubscription();
    const sub = Store.getSubscription();

    return `
    ${topbar('Продвижение', { icon: 'megaphone' })}
    <div class="page">
      <div class="cta-banner" style="margin-bottom:22px">
        <div class="cb-title">${TaskPay.icon('rocket')} Хотите привлечь клиентов, подписчиков или получить отзывы?</div>
        <div class="cb-text">Разместите своё задание и получите реальных исполнителей.</div>
      </div>

      ${hasSub ? `
      <div class="card" style="background:var(--green-soft);border-color:var(--green);text-align:center;margin-bottom:18px">
        <div style="font-size:22px">${TaskPay.icon('shield')}</div>
        <div style="font-weight:700;margin:8px 0 4px">Подписка активна</div>
        <div style="font-size:13px;color:var(--text-2)">Действует до ${fmtDate(sub.until)}</div>
      </div>` : ''}

      <div class="subs-grid">
        ${SUBSCRIPTIONS.map(p => `
        <div class="sub-card${p.hot ? ' sub-card--hot' : ''}">
          ${p.hot ? '<div class="sub-badge">' + TaskPay.icon('bolt') + ' Популярное</div>' : ''}
          <div class="sc-name">${p.name}</div>
          <div class="sc-price">${p.price.toLocaleString('ru-RU')} <small>₽</small></div>
          <div class="sc-desc">${p.desc}</div>
          <button class="btn btn--block${p.hot ? '' : ' btn--ghost'}" data-action="buy-sub" data-plan="${p.id}">${hasSub ? 'Продлить' : 'Выбрать'}</button>
        </div>`).join('')}
      </div>

      <div class="note" style="margin-top:16px">С подпиской вы можете создавать неограниченное количество заданий. Без подписки доступно только одно задание.</div>
    </div>
    ${bottomNav('profile')}`;
  }, () => {});

  /* ================================================================
     WALLET — внутренний кошелёк
  ================================================================ */
  register('wallet', () => {
    const bal = Store.getBalance();
    const useApi = Store.useApi() && window.Api;
    const demo = Store.data.transactions;
    return `
    ${topbar('Мой баланс', { balance: false, icon: 'wallet' })}
    <div class="page">
      <div class="balance-card">
        <div class="b-label">Доступно</div>
        <div class="b-value">${bal.toLocaleString('ru-RU')} <small>₽</small></div>
        <div class="wallet-actions">
          <button class="btn btn--green btn--sm btn--block" data-action="pay-out">${TaskPay.icon('card')} Вывести</button>
          <button class="btn btn--ghost btn--sm btn--block" data-action="navigate" data-page="subs">${TaskPay.icon('megaphone')} Потратить</button>
        </div>
      </div>

      <div class="section-title">История операций <span class="link" data-action="refresh-wallet">${TaskPay.icon('refresh')}</span></div>
      <div id="txn-list">${useApi ? '<div class="empty small" style="padding:20px">Загрузка...</div>' :
        demo.length ? demo.map(t => `
        <div class="op">
          <div class="op-ico">${t.type === 'income' ? TaskPay.icon('download') : TaskPay.icon('send')}</div>
          <div class="op-body">
            <div class="op-title">${esc(t.title)}</div>
            <div class="op-date">${timeAgo(t.date)}</div>
          </div>
          <div class="op-amount ${t.type === 'income' ? 'plus' : 'minus'}">${t.type === 'income' ? '+' : '-'}${fmtMoney(t.amount)}</div>
        </div>`).join('') : '<div class="empty small" style="padding:20px">Нет операций</div>'}
    </div>
    ${bottomNav('wallet')}`;
  }, () => {
    if (Store.useApi() && window.Api) {
      Api.getTransactions(Number(Store.getUser().id)).then(function (rows) {
        const box = q('#txn-list');
        if (!box) return;
        if (!rows || !rows.length) {
          box.innerHTML = '<div class="empty small" style="padding:20px">Нет операций</div>';
          return;
        }
        box.innerHTML = rows.map(function (t) {
          return '<div class="op">' +
            '<div class="op-ico">' + (t.type === 'income' ? TaskPay.icon('download') : TaskPay.icon('send')) + '</div>' +
            '<div class="op-body">' +
              '<div class="op-title">' + esc(t.title || 'Перевод') + '</div>' +
              '<div class="op-date">' + timeAgo(new Date(t.created_at).getTime()) + '</div>' +
            '</div>' +
            '<div class="op-amount ' + (t.type === 'income' ? 'plus' : 'minus') + '">' + (t.type === 'income' ? '+' : '-') + fmtMoney(t.amount) + '</div>' +
          '</div>';
        }).join('');
      });
    }
  });

  /* ================================================================
     PROFILE — профиль пользователя
  ================================================================ */
  register('profile', () => {
    const u = Store.getUser();
    const stats = Store.computeStats();
    const myAssignments = Store.getAssignments().filter(a => a.userId === u.id);
    const workerR = Store.getUserRating('worker');
    const employerR = Store.getUserRating('employer');
    const useApi = Store.useApi();

    return `
    ${topbar('Профиль', { icon: 'user' })}
    <div class="page">
      <div class="profile-head">
        <div class="avatar">${(u.name && u.name[0]) || 'Г'}</div>
        <div>
          <div style="font-size:18px;font-weight:700">${esc(u.name)}${u.is_verified ? ' <span style="color:var(--accent-2)" title="Проверенный пользователь">✔</span>' : ''}</div>
          <div style="font-size:13px;color:var(--text-2)">${u.role === 'employer' ? 'Работодатель' : u.role === 'both' ? 'Исполнитель / Работодатель' : 'Исполнитель'}${isAdmin() ? ' · ' + TaskPay.icon('shield') + ' Админ' : ''}</div>
          ${useApi && u.uid ? '<div class="uid-chip">ID: <b>' + esc(u.uid) + '</b> <span class="uid-copy" data-action="copy-uid">' + TaskPay.icon('copy') + '</span></div>' : ''}
        </div>
      </div>

      ${useApi ? `
      <div class="card" style="margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:8px">${TaskPay.icon('search')} Найти пользователя</div>
        <div class="uid-search">
          <input id="uid-input" placeholder="Введите ID" maxlength="8" style="flex:1;min-width:0;font-size:13px;padding:10px 12px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none">
          <button class="btn btn--sm btn--block" data-action="find-uid" style="flex:none;width:auto;padding:10px 16px">Найти</button>
        </div>
        <div id="uid-result"></div>
      </div>` : ''}

      <div class="stats" style="margin-bottom:14px">
        <div class="stat-card blue">
          <div class="val" style="font-size:20px">${TaskPay.icon('star')} ${workerR.count ? workerR.score.toFixed(1) : '—'}</div>
          <div class="label">Рейтинг исполнителя (${workerR.count} оценок)</div>
        </div>
        <div class="stat-card green">
          <div class="val" style="font-size:20px">${TaskPay.icon('star')} ${employerR.count ? employerR.score.toFixed(1) : '—'}</div>
          <div class="label">Рейтинг работодателя (${employerR.count} оценок)</div>
        </div>
      </div>

      <div style="padding:0 16px">
        <button class="btn btn--block btn--sm" data-action="navigate" data-page="wallet" style="margin-bottom:14px">${TaskPay.icon('wallet')} Мой баланс: ${fmtMoney(Store.getBalance())}</button>
      </div>

      ${useApi ? `
      <div class="card" style="margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:8px">${TaskPay.icon('tag')} Промокод</div>
        <div class="uid-search">
          <input id="promo-input" placeholder="Введите промокод" maxlength="20" style="flex:1;min-width:0;font-size:13px;padding:10px 12px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;text-transform:uppercase">
          <button class="btn btn--sm btn--block" data-action="redeem-promo" style="flex:none;width:auto;padding:10px 16px">Активировать</button>
        </div>
        <div id="promo-result"></div>
      </div>

      <div class="card" style="margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:6px">${TaskPay.icon('bell')} Уведомления по категориям</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:8px">Выберите категории — получайте уведомления о новых заданиях по ним</div>
        <div class="tag-row" style="flex-wrap:wrap">${CATEGORIES.map(c => `
          <button type="button" class="tag cat-sub-tag${(u.subscribed_categories || []).indexOf(c.id) !== -1 ? ' active' : ''}" data-cat="${c.id}" data-action="toggle-cat-sub">${c.icon} ${c.name}</button>
        `).join('')}</div>
      </div>

      <div class="card" style="margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:6px">${TaskPay.icon('share')} Реферальная программа</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:8px">Пригласите друга по коду — оба получите по 50 ₽</div>
        ${u.uid ? '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-size:13px;color:var(--text-2)">Ваш код: <b style="color:var(--accent-2);letter-spacing:.5px">' + esc(u.uid) + '</b></div><span class="uid-copy" data-action="copy-uid" style="flex:none">' + TaskPay.icon('copy') + '</span></div>' : ''}
        <div class="uid-search">
          <input id="ref-input" placeholder="Введите код друга" maxlength="8" style="flex:1;min-width:0;font-size:13px;padding:10px 12px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;text-transform:uppercase">
          <button class="btn btn--sm btn--block" data-action="apply-referral" style="flex:none;width:auto;padding:10px 16px">Активировать</button>
        </div>
        <div id="ref-result"></div>
      </div>
      ` : ''}

      <div class="stats" style="margin-bottom:18px">
        ${statCard(myAssignments.length, 'Взято заданий', 'blue')}
        ${statCard(myAssignments.filter(a => a.status === 'done').length, 'Выполнено', 'green')}
        ${statCard(myAssignments.filter(a => a.status === 'pending').length, 'На проверке', 'accent')}
      </div>

      <div class="section-title">Мои задания</div>
      ${myAssignments.length === 0 ? '<div class="empty"><div class="e-ico">' + TaskPay.icon('inbox') + '</div><div class="e-title">У вас нет взятых заданий</div></div>' :
        myAssignments.map(a => {
          const t = Store.getTask(a.taskId);
          return '<div class="my-task">' +
            '<div class="mt-body" data-action="open-my-task" data-aid="' + a.id + '" style="cursor:pointer">' +
              '<div class="mt-title">' + esc(t ? t.title : 'Задание') + '</div>' +
              '<div class="mt-sub">' + statusHTML(a.status) + '</div>' +
            '</div>' +
            (useApi && t && t.employerId ? '<button data-action="open-employer-chat" data-otherid="' + t.employerId + '" data-taskid="' + a.taskId + '" title="Написать работодателю" style="flex:none;width:32px;height:32px;padding:0;border:none;background:var(--blue-soft);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--blue);cursor:pointer">' + TaskPay.icon('message') + '</button>' : '') +
          '</div>';
        }).join('')}

      ${useApi ? `
      <div class="section-title">${TaskPay.icon('briefcase')} Мои задания как работодателя</div>
      <div id="emp-tasks-list"><div class="empty small" style="padding:20px">Загрузка...</div></div>
      ` : ''}

      ${isAdmin() ? '<button class="btn btn--block btn--ghost btn--sm" data-action="admin-panel" style="margin-top:16px">' + TaskPay.icon('settings') + ' Админ-панель</button>' : ''}
    </div>
    ${bottomNav('profile')}`;
  }, () => {
    /* подгружаем задания работодателя с откликами */
    if (Store.useApi() && window.Api) {
      const me = Number(Store.getUser().id);
      Api.getMyEmployedTasks(me).then(function (rows) {
        const box = q('#emp-tasks-list');
        if (!box) return;
        if (!rows || !rows.length) {
          box.innerHTML = '<div class="empty small" style="padding:20px">Вы пока не размещали заданий</div>';
          return;
        }
        box.innerHTML = rows.map(function (t) {
          const pending = (t.assignments || []).filter(a => a.status === 'pending');
          const done = (t.assignments || []).filter(a => a.status === 'done');
          return '<div class="card" style="padding:14px;margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
              '<div style="flex:1;min-width:0"><b>' + esc(t.title) + '</b>' +
              '<div style="font-size:12px;color:var(--text-3);margin-top:3px">' +
                'Откликов: ' + (t.assignments ? t.assignments.length : 0) +
                ' · На проверке: <b style="color:var(--amber)">' + pending.length + '</b>' +
                ' · Выполнено: <span style="color:var(--green)">' + done.length + '</span></div></div>' +
              '<button class="uid-write-btn" data-action="view-employer-task" data-id="' + t.id + '">Открыть</button>' +
            '</div>' +
            (pending.length ? pending.map(function (a) {
              return '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">' +
                '<div style="flex:1;font-size:13px">' + esc(a.user_name || ('Исполнитель #' + a.user_id)) +
                (a.comment ? '<div style="color:var(--text-3);font-size:12px">' + esc(a.comment) + '</div>' : '') + '</div>' +
                '<span style="font-size:11px;color:var(--amber)">🟡 На проверке</span>' +
                '<button class="btn btn--green btn--sm" data-action="confirm-assignment" data-aid="' + a.id + '" style="width:auto;padding:8px 12px;font-size:12px">Ок</button>' +
                '<button class="btn btn--red btn--sm" data-action="reject-assignment" data-aid="' + a.id + '" style="width:auto;padding:8px 12px;font-size:12px">X</button>' +
              '</div>';
            }).join('') : '') +
          '</div>';
        }).join('');
      });
    }
  });

  /* ================================================================
     CHATS — список диалогов
  ================================================================ */
  register('chats', () => {
    const useApi = Store.useApi() && window.Api;
    const u = Store.getUser();

    const demoDialogs = [
      { id: 1, name: 'Ресторан «Уют»', task: 'Напишите отзыв о нашем ресторане', last: 'Приняли ваш отзыв, спасибо!', time: '10:42', avatar: 'Р' },
      { id: 2, name: 'Startup News', task: 'Подпишитесь на Telegram-канал', last: 'Скриншот подписки готов', time: 'вчера', avatar: 'S' }
    ];

    /* реальные диалоги через Supabase */
    if (useApi) {
      var viewEl = document.getElementById('chats-list');
      /* страховка: если за 3с данные не пришли — показываем Повторить вместо вечной Загрузки */
      var chatTimer = setTimeout(function () {
        var v = document.getElementById('chats-list');
        if (v && v.innerHTML.indexOf('Загрузка') !== -1) {
          v.innerHTML = '<div class="empty"><div class="e-ico">' + TaskPay.icon('alert') + '</div><div class="e-title">Не удалось загрузить чаты</div><div class="e-sub">Проверьте соединение</div>' +
            '<button class="btn btn--block btn--sm" data-action="retry-chats" style="margin-top:12px;width:auto;padding:10px 20px;margin-left:auto;margin-right:auto">' + TaskPay.icon('refresh') + ' Повторить</button></div>';
        }
      }, 3000);
      Api.getChats(Number(u.id)).catch(function (err) {
        console.error('getChats reject', err);
        const view = document.getElementById('chats-list');
        if (view) view.innerHTML = '<div class="empty"><div class="e-ico">' + TaskPay.icon('alert') + '</div><div class="e-title">Не удалось загрузить чаты</div><div class="e-sub">Проверьте соединение и откройте ещё раз</div></div>';
      }).then(function (chats) {
        clearTimeout(chatTimer);
        const view = document.getElementById('chats-list');
        if (!view) return;
        if (!chats || !chats.length) {
          view.innerHTML = '<div class="empty"><div class="e-ico">' + TaskPay.icon('inbox') + '</div><div class="e-title">Нет диалогов</div><div class="e-sub">Напишите исполнителю из карточки задания — здесь появится чат</div></div>';
          return;
        }
        view.innerHTML = chats.map(function (c) {
          const otherId = String(c.user_a) === String(u.id) ? c.user_b : c.user_a;
          const ph = String(otherId).slice(-3);
          return '<div class="chat-item-wrap">' +
            '<div class="chat-item" data-action="open-chat" data-chat="' + c.id + '" data-other="' + otherId + '">' +
              '<div class="chat-av" data-chatav="' + c.id + '">' + ph + '</div>' +
              '<div class="chat-body">' +
                '<div class="chat-top"><span class="chat-name" data-chatname="' + c.id + '">Загрузка...</span>' +
                '<span class="chat-time" data-chattime="' + c.id + '"></span></div>' +
                '<div class="chat-task">' + (c.task_id ? 'Задание #' + c.task_id : 'Чат') + '</div>' +
                '<div class="chat-last" data-chatlast="' + c.id + '">Откройте чат</div>' +
              '</div>' +
            '</div>' +
            '<button class="chat-del-btn" data-action="delete-chat" data-chat="' + c.id + '" aria-label="Удалить чат">' + TaskPay.icon('minus') + '</button>' +
          '</div>';
        }).join('') || '<div class="empty"><div class="e-title">Нет диалогов</div></div>';
        /* подгружаем имя, аватарку и последнее сообщение каждого чата */
        chats.forEach(function (c) {
          const otherId = String(c.user_a) === String(u.id) ? c.user_b : c.user_a;
          Api.getUserInfo(Number(otherId)).then(function (info) {
            if (!info || !view) return;
            const av = view.querySelector('[data-chatav="' + c.id + '"]');
            const nm = view.querySelector('[data-chatname="' + c.id + '"]');
            if (nm) nm.innerHTML = (info.is_admin ? adminVerifiedHTML() : '') + esc(info.name || ('ID ' + otherId));
            if (av && info.photo_url) {
              av.innerHTML = '<img src="' + esc(info.photo_url) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
            } else if (av && info.name) {
              av.textContent = info.name[0];
              av.style.background = 'var(--blue-soft)';
              av.style.display = 'grid';
              av.style.placeItems = 'center';
              av.style.fontSize = '16px';
              av.style.fontWeight = '700';
              av.style.color = 'var(--blue)';
            }
          });
          Api.getLastMessage(Number(c.id)).then(function (last) {
            if (!view || !last) return;
            const b = view.querySelector('[data-chatlast="' + c.id + '"]');
            const tm = view.querySelector('[data-chattime="' + c.id + '"]');
            if (b) b.textContent = String(last.text || 'Откройте чат').slice(0, 80);
            if (tm && last.created_at) tm.textContent = timeAgo(new Date(last.created_at).getTime());
          });
        });
      });
    }

    return `
    ${topbar('Сообщения', { icon: 'message' })}
    <div class="page">
      <div id="chats-list">
        ${useApi
          ? '<div class="empty"><div class="e-ico">⏳</div><div class="e-title">Загрузка...</div></div>'
          : demoDialogs.map(d => `
          <div class="chat-item" data-action="open-chat" data-chat="${d.id}">
            <div class="chat-av">${d.avatar}</div>
            <div class="chat-body">
              <div class="chat-top">
                <span class="chat-name">${esc(d.name)}</span>
                <span class="chat-time">${d.time}</span>
              </div>
              <div class="chat-task">${esc(d.task)}</div>
              <div class="chat-last">${esc(d.last)}</div>
            </div>
          </div>`).join('')}
      </div>
      ${useApi ? '' : '<div class="note">Демо-данные. Подключите Supabase для реального чата.</div>'}
    </div>
    ${bottomNav('home')}`;
  }, () => {});

  /* ================================================================
     CHAT DETAIL — переписка (реальная через Supabase / демо)
  ================================================================ */
  /* фирменный бейдж «админ»/«верифицирован» — SVG-щит на градиентной подложке */
  function adminVerifiedHTML() {
    return '<span class="admin-shield" title="Администратор">' + TaskPay.icon('shield') + '</span>';
  }
  /* отрисовка одного сообщения: системные (⚙️ и др.) — плашкой по центру,
   вложения (IMG:/FILE:) — картинкой/файлом, остальные — обычными пузырями */
  function chatMsgHTML(m, meId) {
    const text = String(m.text || '');ring(m.text || '');
    const t = new Date(m.created_at || Date.now()).getTime();
    const fch = text.charAt(0);
    if (fch === '⚙' || fch === '📦' || fch === '🔔') {
      /* системная плашка: свой HTML разрешён (генерируем сами), newline сохраняем */
      return '<div class="msg-system">' + (text.replace(/^⚙️\s*/, '')) + '</div>';
    }
    /* карточка заказа: [ORDER]<aid>|<employerId>|<текст> → плашка с кнопками
       Подтвердить/Отклонить (видны только работодателю) */
    if (text.indexOf('[ORDER]') === 0) {
      const rest = text.slice(7);
      const p1 = rest.indexOf('|');
      const p2 = rest.indexOf('|', p1 + 1);
      const aid = (p1 > 0 ? rest.slice(0, p1) : '').trim();
      const empId = (p2 > 0 ? rest.slice(p1 + 1, p2) : '').trim();
      const bodyText = p2 > 0 ? rest.slice(p2 + 1) : rest.slice(p1 + 1);
      const isEmployer = empId && String(meId) === String(empId);
      const actions = isEmployer
        ? '<div class="order-actions">' +
            '<button class="btn btn--green btn--sm" data-action="confirm-assignment" data-aid="' + esc(aid) + '" style="flex:1;padding:9px 10px;font-size:13px;width:auto">✅ Подтвердить</button>' +
            '<button class="btn btn--red btn--sm" data-action="reject-assignment" data-aid="' + esc(aid) + '" style="flex:1;padding:9px 10px;font-size:13px;width:auto">❌ Отклонить</button>' +
          '</div>'
        : '';
      return '<div class="msg-system order-card">' + esc(bodyText) + actions + '</div>';
    }
    if (text.indexOf('IMG:') === 0 || text.indexOf('FILE:') === 0) {
      try {
        const sep = text.indexOf('|');
        const kind = text.indexOf('IMG:') === 0 ? 'img' : 'file';
        const name = sep > 0 ? text.slice(4, sep) : 'Вложение';
        const data = sep > 0 ? text.slice(sep + 1) : text.slice(4);
        const mine = String(m.from_user) === String(meId);
        const body = kind === 'img'
          ? '<img class="msg-img" src="' + data + '" alt="' + esc(name) + '" onclick="window.open(this.src)" style="max-width:240px;border-radius:14px;display:block;cursor:pointer">'
          : '<a class="msg-file" href="' + data + '" download="' + esc(name) + '" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit">' +
              '<span style="font-size:22px">📎</span><span style="font-weight:600">' + esc(name) + '</span></a>';
        return '<div class="msg ' + (mine ? 'msg--me' : 'msg--them') + '">' +
          '<div class="msg-text" style="padding:' + (kind === 'img' ? '6px' : '11px 15px') + '">' + body + '</div>' +
          '<div class="msg-time">' + (mine ? '✓✓ ' : '') + timeAgo(t) + '</div></div>';
      } catch (e) {
        return '<div class="msg msg--them"><div class="msg-text">Вложение</div></div>';
      }
    }
    const mine = String(m.from_user) === String(meId);
    const body = '<div class="msg-text">' + esc(text) + '</div>' +
      '<div class="msg-time">' + (mine ? '✓✓ ' : '') + timeAgo(t) + '</div>';
    return mine
      ? '<div class="msg msg--me">' + body + '</div>'
      : '<div class="msg msg--them">' + body + '</div>';
  }

  register('chat-detail', (s) => {
    const useApi = Store.useApi() && window.Api;
    const chatId = Number(s.id);
    const me = Store.getUser();

    /* определяем собеседника и подгружаем его имя/аватарку */
    let otherAvatarHTML = '';
    if (useApi) {
      Api.getChat(chatId).then(function (chat) {
        if (!chat) return;
        const otherId = String(chat.user_a) === String(me.id) ? chat.user_b : chat.user_a;
        const av = document.querySelector('.chat-head-av');
        const nm = document.querySelector('.chat-head-name');
        if (av && Number(otherId) === Number(Store.getUser().id)) {
          /* чат с самим собой — редко, но ок */
          av.innerHTML = '<div class="letter">Я</div>';
        }
        Api.getUserInfo(Number(otherId)).then(function (info) {
          if (av) {
            if (info && info.photo_url) {
              av.innerHTML = '<img src="' + esc(info.photo_url) + '" alt="">';
            } else {
              const l = (info && info.name && info.name[0]) || String(otherId).slice(-1);
              av.innerHTML = '<div class="letter">' + esc(l) + '</div>';
            }
          }
          if (nm) nm.innerHTML = (info && info.is_admin ? adminVerifiedHTML() : '') + esc((info && info.name) || ('ID ' + otherId));
        });
        /* кнопка перехода к заданию + удаление чата */
        const btnBox = document.getElementById('chat-head-taskbtn');
        if (btnBox) {
          let h = '';
          if (chat.task_id) {
            h += '<button class="btn btn--sm btn--ghost" data-action="open-task-from-chat" data-taskid="' + chat.task_id + '" style="padding:6px 10px;font-size:12px;white-space:nowrap">' + TaskPay.icon('clipboard') + ' К заданию</button>';
          }
          h += '<button class="btn btn--sm btn--ghost" data-action="delete-chat" data-chat="' + chat.id + '" style="padding:6px 10px;font-size:12px;white-space:nowrap;color:var(--red)">' + TaskPay.icon('minus') + '</button>';
          btnBox.innerHTML = h;
        }
      });
    }

    /* реальная переписка */
    if (useApi) {
      Api.getMessages(chatId).then(function (rows) {
        const box = document.getElementById('chat-msgs');
        if (!box) return;
        box.innerHTML = (rows && rows.length ? rows : []).map(function (m) {
          return chatMsgHTML(m, me.id);
        }).join('') || '<div class="msg-system">Сообщений пока нет</div>';
        box.scrollTop = box.scrollHeight;
      });
      /* realtime: новые сообщения подставляются сразу */
      window._chatSub && window._chatSub.unsubscribe();
      window._chatSub = Api.subscribeChats(function (msg) {
        const box = document.getElementById('chat-msgs');
        if (!box || String(msg.chat_id) !== String(chatId)) return;
        const div = document.createElement('div');
        div.insertAdjacentHTML('afterbegin', chatMsgHTML(msg, me.id));
        const node = div.firstChild;
        box.appendChild(node);
        box.scrollTop = box.scrollHeight;
      });
    }

    const demo = [
      { me: false, text: 'Здравствуйте! Выполнил ваше задание, отправил отзыв' },
      { me: true,  text: 'Отлично, спасибо! Проверяем' },
      { me: false, text: 'Приняли ваш отзыв, спасибо! Награда уже на балансе' }
    ];

    return `
    <header class="topbar">
      <button class="tb-back" data-action="back">‹</button>
      <div class="chat-head" style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">
        <span class="chat-head-av" style="width:34px;height:34px;border-radius:50%;overflow:hidden;flex:none;background:var(--card);border:1px solid var(--border);display:grid;place-items:center;color:var(--text-3)">
          <div class="letter" style="font-size:15px;font-weight:700;color:var(--accent-2)">…</div>
        </span>
        <span class="chat-head-name" style="font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto">Загрузка...</span>
        <span id="chat-head-taskbtn" style="margin-left:auto;flex:none;display:flex;align-items:center;gap:8px"></span>
      </div>
    </header>
    <div class="chat-wrap">
      <div class="chat-messages" id="chat-msgs">
        ${useApi
          ? '<div class="msg-system">Загрузка...</div>'
          : demo.map(m => `
            <div class="msg ${m.me ? 'msg--me' : 'msg--them'}">
              <div class="msg-text">${esc(m.text)}</div>
              <div class="msg-time">${m.me ? '✓✓ ' : ''}10:4${m.me ? '1' : '0'}</div>
            </div>`).join('')}
        ${useApi ? '' : '<div class="msg-system">Демо-чат</div>'}
      </div>
      <div class="chat-input">
        <button type="button" class="chat-send chat-attach" data-action="chat-attach" ${useApi ? '' : 'disabled'} aria-label="Прикрепить файл">📎</button>
        <input type="file" id="chat-file-input" style="display:none" ${useApi ? '' : 'disabled'}>
        <input type="text" id="chat-input" placeholder="Напишите сообщение..." ${useApi ? '' : 'disabled'}>
        <button class="chat-send" data-action="send-chat" data-chat="${chatId}" ${useApi ? '' : 'disabled'}>${TaskPay.icon('send')}</button>
      </div>
    </div>`;
  }, () => {
    /* прикрепление файла/картинки в чат */
    const fi = $('chat-file-input');
    if (fi && !fi.dataset.bound) {
      fi.dataset.bound = '1';
      fi.addEventListener('change', function () {
        const file = fi.files && fi.files[0];
        fi.value = '';
        if (!file) return;
        const chatId = Number(TaskPay.routeState().id);
        try {
          const maxBytes = 4 * 1024 * 1024;
          if (file.size > maxBytes) { toast('Максимум 4 МБ', true); return; }
          const isImage = (file.type || '').indexOf('image/') === 0;
          const reader = new FileReader();
          reader.onload = function () {
            const dataUrl = reader.result;
            if (isImage) {
              /* сжимаем картинку: уменьшаем до 1100px и конвертируем в JPEG,
                 чтобы сообщение не раздувалось до мегабайтов и грузилось быстро */
              const img = new Image();
              img.onload = function () {
                const MAX = 1100;
                let w = img.width, h = img.height;
                const scale = Math.min(1, MAX / Math.max(w, h));
                w = Math.round(w * scale);
                h = Math.round(h * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                const out = canvas.toDataURL('image/jpeg', 0.78);
                const payload = 'IMG:' + file.name.replace(/\.\w+$/, '.jpg') + '|' + out;
                toast('Отправка...');
                Api.sendMessage(chatId, Number(Store.getUser().id), payload, Store.getUser().name).then(function () {
                  toast('Отправлено');
                  vibrate();
                }).catch(function () { toast('Не удалось отправить файл', true); });
              };
              img.onerror = function () { toast('Не удалось сжать изображение', true); };
              img.src = dataUrl;
            } else {
              const payload = 'FILE:' + file.name + '|' + dataUrl;
              toast('Отправка...');
              Api.sendMessage(chatId, Number(Store.getUser().id), payload, Store.getUser().name).then(function () {
                toast('Отправлено');
                vibrate();
              }).catch(function () { toast('Не удалось отправить файл', true); });
            }
          };
          reader.onerror = function () { toast('Не удалось прочитать файл', true); };
          reader.readAsDataURL(file);
        } catch (e) {
          toast('Ошибка: ' + e.message, true);
        }
      });
    }
  });

  /* ================================================================
     ADMIN — админ-панель
  ================================================================ */
  let _adminUid = null;   /* последний найденный UID в админке */
  let _lastSendKey = '';   /* защита от двойной отправки сообщения */
  let _lastSendTime = 0;

  function adminUserCard(u) {
    if (!u) return '<div class="empty small" style="padding:16px">Пользователь не найден</div>';
    const blocked = !!u.is_blocked;
    const isAdm = !!u.is_admin;
    const unlim = !!u.can_post_unlimited;
    const verified = !!u.is_verified;
    return `
    <div class="card" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
        <div style="min-width:0">
          <div style="font-weight:700;font-size:16px">${esc(u.name || 'Гость')}</div>
          <div style="font-size:13px;color:var(--text-2);margin-top:4px">
            UID: <b>${esc(u.uid || '—')}</b> · ID: ${u.id}
          </div>
        </div>
        <div style="text-align:right;flex:none">
          <div style="font-weight:800;font-size:18px">${fmtMoney(u.balance != null ? u.balance : 0)}</div>
          <div style="font-size:11px;color:${blocked ? 'var(--red)' : 'var(--green)'};font-weight:700;margin-top:2px">
            ${blocked ? '🔒 Заблокирован' : '✅ Активен'}${isAdm ? ' · ⚙ Админ' : ''}
          </div>
        </div>
      </div>

      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="admin-amount" type="number" placeholder="Сумма" value="100" style="width:90px;flex:none;padding:9px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;text-align:center">
          <button class="btn btn--green btn--sm" data-action="admin-give" style="flex:1">${TaskPay.icon('plus')} Начислить</button>
          <button class="btn btn--red btn--sm" data-action="admin-take" style="flex:1">${TaskPay.icon('minus')} Списать</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="admin-balance-set" type="number" placeholder="Точно" value="" style="width:90px;flex:none;padding:9px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;text-align:center">
          <button class="btn btn--sm" data-action="admin-set-balance" style="flex:1">${TaskPay.icon('save')} Задать баланс</button>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn--sm ${blocked ? 'btn--green' : 'btn--red'}" data-action="admin-set-block" data-blocked="${blocked ? '' : '1'}" style="flex:1">${blocked ? '🔓 Разблокировать' : '🔒 Заблокировать'}</button>
          <button class="btn btn--sm ${isAdm ? 'btn--ghost' : 'btn--amber'}" data-action="admin-set-admin" data-admin="${isAdm ? '' : '1'}" style="flex:1">${isAdm ? '👤 Снять админа' : '⚙ Дать админа'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn--sm ${unlim ? 'btn--green' : 'btn--ghost'}" data-action="admin-set-unlimited" data-unlim="${unlim ? '' : '1'}" style="flex:1">${unlim ? '✅ Публикации без лимита' : '🔓 Снять лимит публикаций'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn--sm ${verified ? 'btn--green' : 'btn--ghost'}" data-action="admin-set-verified" data-verified="${verified ? '' : '1'}" style="flex:1">${verified ? '✔ Верифицирован' : '✔ Поставить галочку'}</button>
        </div>
      </div>
    </div>`;
  }

  register('admin', () => {
    return `
    ${topbar('Админ-панель', { icon: 'settings' })}
    <div class="page">
      <div class="section-title">Управление платформой</div>
      <div id="admin-stats" class="card" style="text-align:center;margin-bottom:16px">
        <div style="font-size:13px;color:var(--text-2)">Статистика загружается...</div>
      </div>

      <div class="section-title">Пользователи</div>
      <div class="card">
        <div style="font-weight:600;margin-bottom:8px">${TaskPay.icon('search')} Найти по уникальному ID</div>
        <div class="uid-search">
          <input id="admin-uid-input" placeholder="Введите UID" maxlength="8" style="flex:1;min-width:0;font-size:13px;padding:10px 12px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none">
          <button class="btn btn--sm btn--block" data-action="admin-find-uid" style="flex:none;width:auto;padding:10px 16px">Найти</button>
        </div>
        <div id="admin-user-result"></div>
      </div>

      <div class="section-title" style="margin-top:18px">Отклики на проверке</div>
      <div id="admin-pending-list"><div class="empty small" style="padding:20px">Загрузка...</div></div>

      <div class="section-title" style="margin-top:18px">${TaskPay.icon('shield')} Модерация заданий</div>
      <div id="admin-moderation-list"><div class="empty small" style="padding:20px">Загрузка...</div></div>

      <div class="section-title" style="margin-top:18px">${TaskPay.icon('bolt')} Задания на бирже</div>
      <div id="admin-market-list"><div class="empty small" style="padding:20px">Загрузка...</div></div>

      <div class="section-title" style="margin-top:18px">${TaskPay.icon('megaphone')} Рассылка всем пользователям</div>
      <div class="card">
        <textarea id="admin-broadcast-text" placeholder="Текст уведомления..." style="width:100%;min-height:70px;padding:10px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
        <button class="btn btn--block btn--sm" data-action="admin-broadcast" style="margin-top:8px">${TaskPay.icon('send')} Отправить всем</button>
      </div>

      <div style="height:14px"></div>
      <div class="section-title">${TaskPay.icon('tag')} Промокоды</div>
      <div class="card" style="margin-bottom:12px">
        <div class="uid-search" style="gap:8px">
          <input id="admin-promo-code" placeholder="Код" maxlength="20" style="flex:1;min-width:0;font-size:13px;padding:10px 12px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;text-transform:uppercase">
          <input id="admin-promo-bonus" type="number" placeholder="Бонус ₽" value="100" style="width:86px;flex:none;font-size:13px;padding:10px 8px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;text-align:center">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <input id="admin-promo-uses" type="number" placeholder="Кол-во" value="1" min="1" style="width:76px;flex:none;font-size:13px;padding:10px 8px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;text-align:center">
          <button class="btn btn--sm" data-action="admin-create-promo" style="flex:1">${TaskPay.icon('plus')} Создать промокод</button>
        </div>
        <div id="admin-promo-list"><div class="empty small" style="padding:12px">Загрузка...</div></div>
      </div>

      <div class="section-title" style="margin-top:18px">${TaskPay.icon('alert')} Жалобы</div>
      <div id="admin-complaints-list"><div class="empty small" style="padding:20px">Загрузка...</div></div>

      <div style="height:14px"></div>
      <div class="section-title">Тарифы (быстрая правка)</div>
      ${SUBSCRIPTIONS.map(p => `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div><div style="font-weight:600">${p.name}</div><div style="font-size:13px;color:var(--text-3)">${p.days} дн</div></div>
        <input type="number" class="admin-price" data-plan="${p.id}" value="${p.price}" style="width:80px;padding:8px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;text-align:center">
        <small style="color:var(--text-3)">₽</small>
      </div>`).join('')}
      <button class="btn btn--block btn--sm" data-action="save-prices" style="margin-bottom:18px">${TaskPay.icon('save')} Сохранить цены</button>

      <button class="btn btn--block btn--ghost btn--sm" data-action="navigate" data-page="subs">${TaskPay.icon('megaphone')} Просмотр тарифов</button>
    </div>`;
  }, () => { /* подгружаем отклики «на проверке» для админ-панели */
    if (!(Store.useApi() && window.Api)) return;
    /* реальная статистика из БД */
    const statsBox = q('#admin-stats');
    if (statsBox && Api.adminGetStats) {
      Api.adminGetStats().then(function (st) {
        if (!statsBox) return;
        if (!st) {
          statsBox.innerHTML = '<div style="font-size:13px;color:var(--text-3)">Нет данных</div>';
          return;
        }
        const card = function (v, label) {
          return '<div style="min-width:0;flex:1"><div style="font-weight:800;font-size:17px">' + v + '</div><div style="font-size:11px;color:var(--text-3);line-height:1.3;margin-top:2px">' + label + '</div></div>';
        };
        statsBox.innerHTML =
          '<div style="font-size:13px;color:var(--text-2)">Статистика платформы</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;text-align:left">' +
            card(st.tasksActive, 'Активных заданий') +
            card(st.tasksModeration, 'На модерации') +
            card(st.assignmentsDone, 'Выполнено') +
            card(st.assignmentsPending, 'На проверке') +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;text-align:left;border-top:1px solid var(--border);padding-top:12px">' +
            card(st.usersTotal, 'Пользователей') +
            card('<span style="color:var(--green)">' + fmtMoney(st.totalIncome) + '</span>', 'Начислено') +
            card('<span style="color:var(--amber)">' + fmtMoney(st.totalExpense) + '</span>', 'Списано') +
            card(fmtMoney(st.balanceTotal), 'Баланс платформы') +
          '</div>';
      }).catch(function () {
        if (statsBox) statsBox.innerHTML = '<div style="font-size:13px;color:var(--text-3)">Ошибка загрузки</div>';
      });
    }
    const box = q('#admin-pending-list');
    if (!box) return;
    Api.adminGetPendingAssignments().then(function (rows) {
      if (!box) return;
      if (!rows || !rows.length) {
        box.innerHTML = '<div class="empty small" style="padding:20px">Нет откликов на проверке</div>';
        return;
      }
      box.innerHTML = rows.map(function (a) {
        const t = a.tasks || {};
        return '<div class="card" style="padding:14px;margin-bottom:10px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;font-weight:700">' + esc(t.title || ('Задание #' + a.task_id)) + '</div>' +
              '<div style="font-size:12px;color:var(--text-2);margin-top:3px">Исполнитель: <b>' + esc(a.user_name || ('#' + a.user_id)) + '</b></div>' +
              (a.comment ? '<div style="font-size:12px;color:var(--text-3)">' + esc(a.comment) + '</div>' : '') +
              '<div style="font-size:12px;color:var(--amber);margin-top:3px">🟡 На проверке · награда ' + fmtMoney(a.reward) + '</div>' +
            '</div>' +
            '<button class="btn btn--green btn--sm" data-action="admin-confirm-assign" data-aid="' + a.id + '" data-employer="' + (t.employer_id != null ? t.employer_id : '') + '" style="width:auto;padding:8px 12px;font-size:12px">Ок</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }).catch(function () {
      if (box) box.innerHTML = '<div class="empty small" style="padding:20px">Ошибка загрузки</div>';
    });
    /* задания на модерацию */
    const mbox = q('#admin-moderation-list');
    if (mbox) {
      Api.getModerationTasks().then(function (rows) {
        if (!mbox) return;
        if (!rows || !rows.length) {
          mbox.innerHTML = '<div class="empty small" style="padding:20px">Нет заданий на модерации</div>';
          return;
        }
        mbox.innerHTML = rows.map(function (tt) {
          const cat = Category.byId(tt.category);
          const pl = tt.platform ? Platform.byId(tt.platform) : null;
          const catName = cat ? cat.name : (tt.category || 'other');
          const platName = pl ? pl.name : (tt.platform || '—');
          const proofTxt = (tt.proof || []).map(function (p) {
            const pr = Proof.byId(p);
            return pr ? pr.name : p;
          }).join(', ') || '—';
          return '<div class="card" style="padding:14px;margin-bottom:10px">' +
            '<div style="font-size:14px;font-weight:700">' + esc(tt.title) + '</div>' +
            '<div style="font-size:12px;color:var(--text-2);margin-top:4px">' + esc(tt.description || '') + '</div>' +
            '<div style="font-size:12px;color:var(--text-3);margin-top:6px;line-height:1.6">' +
              '👤 Работодатель: <b>' + esc(tt.employer_name || ('#' + tt.employer_id)) + '</b><br>' +
              '🏷 Категория: ' + esc(catName) + ' · 📱 Платформа: ' + esc(platName) + '<br>' +
              '💰 Награда: <b>' + fmtMoney(tt.reward) + '</b> · 👥 Мест: ' + (tt.spots_total != null ? tt.spots_total : '—') + '<br>' +
              '⏱ Срок: ' + (tt.deadline_days != null ? tt.deadline_days + ' дн' : '—') + ' · 📅 Создано: ' + timeAgo(new Date(tt.created_at).getTime()) + '<br>' +
              '🖼 Подтверждение: ' + esc(proofTxt) +
            '</div>' +
            '<div style="font-size:13px;color:var(--text-2);margin-top:6px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;padding:8px 10px;white-space:pre-wrap">' + esc(tt.instruction || 'Без инструкции') + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:10px">' +
              '<button class="btn btn--green btn--sm" data-action="admin-moderate" data-id="' + tt.id + '" data-dec="approve" style="flex:1">✅ Выпустить</button>' +
              '<button class="btn btn--red btn--sm" data-action="admin-moderate" data-id="' + tt.id + '" data-dec="reject" style="flex:1">❌ Отклонить</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }).catch(function () {
        if (mbox) mbox.innerHTML = '<div class="empty small" style="padding:20px">Ошибка загрузки</div>';
      });
    }
    /* задания на бирже (для удаления админом) */
    const mktbox = q('#admin-market-list');
    if (mktbox) {
      Api.adminGetMarketTasks().then(function (rows) {
        if (!mktbox) return;
        if (!rows || !rows.length) {
          mktbox.innerHTML = '<div class="empty small" style="padding:20px">На бирже нет заданий</div>';
          return;
        }
        mktbox.innerHTML = rows.map(function (tt) {
          const cat = Category.byId(tt.category);
          const catName = cat ? cat.name : (tt.category || 'other');
          return '<div class="card" style="padding:14px;margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
              '<div style="flex:1;min-width:0">' +
                '<div style="font-size:14px;font-weight:700">' + esc(tt.title) + '</div>' +
                '<div style="font-size:12px;color:var(--text-3);margin-top:3px">' +
                  '🏷 ' + esc(catName) + ' · 💰 ' + fmtMoney(tt.reward) + ' · 👥 ' + (tt.spots_left != null ? tt.spots_left : '—') + ' мест · 👤 ' + esc(tt.employer_name || '—') +
                '</div>' +
              '</div>' +
              '<button class="btn btn--red btn--sm" data-action="admin-delete-task" data-id="' + tt.id + '" style="flex:none;width:auto;padding:8px 12px;font-size:12px">🗑 Удалить</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }).catch(function () {
        if (mktbox) mktbox.innerHTML = '<div class="empty small" style="padding:20px">Ошибка загрузки</div>';
      });
    }
    /* промокоды */
    const promoBox = q('#admin-promo-list');
    if (promoBox && Api.adminGetPromocodes) {
      Api.adminGetPromocodes().then(function (rows) {
        if (!promoBox) return;
        if (!rows || !rows.length) {
          promoBox.innerHTML = '<div class="empty small" style="padding:12px">Нет промокодов</div>';
          return;
        }
        promoBox.innerHTML = rows.map(function (pc) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--border)">' +
            '<div style="flex:1;min-width:0"><b style="letter-spacing:.5px">' + esc(pc.code) + '</b>' +
            '<div style="font-size:12px;color:var(--text-3)">Бонус ' + fmtMoney(pc.bonus) + ' · осталось ' + (pc.uses_left != null ? pc.uses_left : '—') + ' шт</div></div>' +
            '<button class="btn btn--red btn--sm" data-action="admin-delete-promo" data-id="' + pc.id + '" style="width:auto;padding:8px 10px;font-size:12px">🗑</button>' +
          '</div>';
        }).join('');
      }).catch(function () {
        if (promoBox) promoBox.innerHTML = '<div class="empty small" style="padding:12px">Ошибка загрузки</div>';
      });
    }
    /* жалобы */
    const compBox = q('#admin-complaints-list');
    if (compBox && Api.adminGetComplaints) {
      Api.adminGetComplaints().then(function (rows) {
        if (!compBox) return;
        if (!rows || !rows.length) {
          compBox.innerHTML = '<div class="empty small" style="padding:20px">Нет жалоб</div>';
          return;
        }
        compBox.innerHTML = rows.map(function (c) {
          return '<div class="card" style="padding:12px;margin-bottom:10px">' +
            '<div style="font-size:13px">⚠️ ' + esc(c.reason || 'Без причины') + '</div>' +
            '<div style="font-size:12px;color:var(--text-3);margin-top:4px">От: ' + esc(c.user_name || ('#' + c.user_id)) +
              (c.target_name ? ' · На: ' + esc(c.target_name) : '') +
              (c.task_id ? ' · Задание #' + c.task_id : '') + ' · ' + timeAgo(new Date(c.created_at).getTime()) + '</div>' +
            '<button class="btn btn--sm btn--ghost" data-action="admin-complaint-close" data-id="' + c.id + '" style="margin-top:8px;width:100%">Закрыть</button>' +
          '</div>';
        }).join('');
      }).catch(function () {
        if (compBox) compBox.innerHTML = '<div class="empty small" style="padding:20px">Ошибка загрузки</div>';
      });
    }
  });

  /* ================================================================
     ГЛОБАЛЬНАЯ ПРИВЯЗКА СОБЫТИЙ (нативный click)
     Тап/свайп браузер отличает сам; задержка 300мс убрана через
     touch-action: manipulation в CSS. Никаких кастомных touch-костылей.
  ================================================================ */
  function handleWriteUser(otherId) {
    const me = Store.getUser();
    if (Store.useApi() && window.Api) {
      Api.findOrCreateChat(Number(me.id), Number(otherId)).then(function (chat) {
        if (!chat) { toast('Ошибка создания чата', true); return; }
        toast('Чат создан!');
        vibrate();
        navigate('chat-detail', { id: chat.id });
      });
    } else {
      toast('Доступно с подключённой базой', true);
    }
  }

  function runAction(el) {
    if (!el || !el.dataset) return;
    const action = el.dataset.action;
    if (!action) return;

    /* заблокированный пользователь может только смотреть: домой, назад, профиль, баланс */
    const me = Store.getUser();
    const allowWhenBlocked = ['back', 'tab', 'navigate', 'open-profile', 'copy-uid', 'refresh-wallet'];
    if (me.is_blocked && !allowWhenBlocked.includes(action)) {
      toast('Аккаунт заблокирован администратором', true);
      return;
    }
    switch (action) {
      case 'back': {
        navigate(TaskPay.backTo ? TaskPay.backTo(TaskPay.currentRoute()) : 'home');
        vibrate();
        break;
      }
      case 'open-support': {
        try {
          if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.openTelegramLink) {
            Telegram.WebApp.openTelegramLink('https://t.me/jack_Yumitask');
          } else {
            window.open('https://t.me/jack_Yumitask', '_blank');
          }
        } catch (e) {
          window.open('https://t.me/jack_Yumitask', '_blank');
        }
        break;
      }
      case 'tab': {
        const page = el.dataset.tab || 'home';
        navigate(page);
        vibrate();
        break;
      }
      case 'navigate': {
        navigate(el.dataset.page);
        vibrate();
        break;
      }
      case 'open-profile': {
        navigate('profile');
        vibrate();
        break;
      }
      case 'copy-uid': {
        const u = Store.getUser();
        if (u.uid && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(u.uid)
            .then(() => toast('UID скопирован: ' + u.uid))
            .catch(() => toast('UID: ' + u.uid));
        } else {
          toast('UID: ' + (u.uid || 'не найден'));
        }
        vibrate();
        break;
      }
      case 'find-uid': {
        const input = $('uid-input');
        const uid = input ? input.value.trim().toUpperCase() : '';
        const box = $('uid-result');
        if (!uid) { toast('Введите UID'); return; }
        if (!box) return;
        try {
          Api.getUserByUid(uid).then(function (found) {
            if (!found) {
              box.innerHTML = '<div class="uid-search-result" style="margin-top:10px;font-size:13px;color:var(--red)">Пользователь не найден</div>';
              return;
            }
            const me = Store.getUser();
            if (String(found.id) === String(me.id)) {
              box.innerHTML = '<div class="uid-search-result" style="margin-top:10px;font-size:13px;color:var(--text-2)">Это вы 🙂</div>';
              return;
            }
            box.innerHTML = '<div class="uid-search-result" style="display:flex;align-items:center;gap:10px">' +
              '<div class="chat-av" style="width:36px;height:36px;font-size:14px">' + esc((found.name || '?')[0]) + '</div>' +
              '<div style="flex:1;min-width:0"><b>' + esc(found.name || 'Пользователь') + '</b>' +
              '<div style="font-size:12px;color:var(--text-3)">ID: ' + esc(found.uid) + '</div></div>' +
              '<button class="uid-write-btn" data-id="' + found.id + '">' + TaskPay.icon('message') + ' Написать</button>' +
            '</div>';
            /* вешаем обработчик напрямую — bindActions уже не перезапустится */
            const wb = box.querySelector('.uid-write-btn');
            if (wb) { wb.onclick = function () { handleWriteUser(Number(this.dataset.id)); }; }
          });
        } catch (e) {
          toast('Ошибка поиска', true);
        }
        vibrate();
        break;
      }
      case 'open-task': {
        navigate('task-detail', { id: el.dataset.id });
        vibrate();
        break;
      }
      case 'open-my-task': {
        navigate('my-task-detail', { aid: el.dataset.aid });
        vibrate();
        break;
      }
      case 'view-employer-task': {
        navigate('task-detail', { id: el.dataset.id });
        vibrate();
        break;
      }
      case 'open-chat': {
        navigate('chat-detail', { id: el.dataset.chat });
        vibrate();
        break;
      }
      case 'delete-chat': {
        const chatId = Number(el.dataset.chat);
        const chatIdFromState = TaskPay.routeState().id;
        const id = chatId || Number(chatIdFromState);
        if (!id) { toast('Нет данных чата', true); return; }
        if (!Store.useApi() || !window.Api) { toast('Удаление доступно с подключённой базой', true); return; }
        const chat = Store.getChat ? Store.getChat(id) : null;
        tgConfirm('Удалить чат', 'Удалить чат и всю переписку?').then(ok => {
          if (!ok) return;
          Api.deleteChat(id).then(function (res) {
            if (res) {
              toast('Чат удалён');
              vibrate();
              navigate('chats');
            } else {
              toast('Не удалось удалить чат', true);
            }
          });
        });
        break;
      }
      case 'report-task': {
        const taskId = Number(el.dataset.id);
        const emp = el.dataset.emp ? Number(el.dataset.emp) : null;
        const empName = el.dataset.empname || '';
        const box = $('report-task-box');
        if (!box) return;
        box.innerHTML = '<div class="card" style="margin-top:8px;padding:12px">' +
          '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Пожаловаться на задание</div>' +
          '<textarea id="report-reason" placeholder="Опишите причину жалобы..." style="width:100%;min-height:60px;padding:10px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;box-sizing:border-box;font-family:inherit;resize:vertical"></textarea>' +
          '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<button class="btn btn--sm btn--red" data-action="submit-report" data-id="' + taskId + '" data-emp="' + (emp || '') + '" data-empname="' + esc(empName) + '" style="flex:1">Отправить жалобу</button>' +
            '<button class="btn btn--sm btn--ghost" data-action="report-cancel" style="flex:1">Отмена</button>' +
          '</div>' +
        '</div>';
        vibrate();
        break;
      }
      case 'report-cancel': {
        const box = $('report-task-box');
        if (box) box.innerHTML = '';
        break;
      }
      case 'submit-report': {
        const reason = ($('report-reason') || {}).value || '';
        const taskId = Number(el.dataset.id);
        const emp = el.dataset.emp ? Number(el.dataset.emp) : null;
        const empName = el.dataset.empname || '';
        if (!reason) { toast('Опишите причину жалобы', true); return; }
        const u = Store.getUser();
        Api.sendComplaint(Number(u.id), u.name, taskId, emp, empName, reason).then(function (res) {
          const box = $('report-task-box');
          if (box) box.innerHTML = '';
          toast(res ? 'Жалоба отправлена администратору' : 'Ошибка отправки', !res);
          vibrate();
        });
        break;
      }
      case 'open-employer-chat': {
        const me = Store.getUser();
        const otherId = Number(el.dataset.otherid);
        const taskId = el.dataset.taskid ? Number(el.dataset.taskid) : null;
        if (!me.id || !otherId) { toast('Нет данных', true); return; }
        Api.findOrCreateChat(Number(me.id), otherId, taskId).then(function (chat) {
          if (!chat) { toast('Ошибка создания чата', true); return; }
          navigate('chat-detail', { id: chat.id });
        });
        break;
      }
      case 'chat-attach': {
        const fi = $('chat-file-input');
        if (fi) fi.click();
        break;
      }
      case 'send-chat': {
        const chatId = Number(el.dataset.chat);
        const input = $('chat-input');
        const text = input ? input.value.trim() : '';
        if (!text || !Store.useApi() || !window.Api) { toast('Введите сообщение'); return; }
        /* защита от двойного tap: если отправка того же текста уже идёт — игнорируем */
        if (_lastSendKey === text + '@' + chatId && Date.now() - _lastSendTime < 1500) return;
        _lastSendKey = text + '@' + chatId;
        _lastSendTime = Date.now();
        window._chatSending = true;
        Api.sendMessage(chatId, Number(Store.getUser().id), text, Store.getUser().name).then(function (msg) {
          window._chatSending = false;
          if (msg && input) {
            input.value = '';
            _lastSendKey = '';
          }
        }).catch(function () {
          window._chatSending = false;
          toast('Не удалось отправить', true);
        });
        vibrate();
        break;
      }
      case 'filter-cat': {
        const f = TaskPay.filters();
        f.cat = el.dataset.cat;
        navigate('tasks');
        break;
      }
      case 'filter-platform': {
        const f = TaskPay.filters();
        f.platform = el.dataset.platform;
        navigate('tasks');
        break;
      }
      case 'filter-sort': {
        const f = TaskPay.filters();
        f.sort = el.dataset.sort;
        navigate('tasks');
        break;
      }
      case 'rate-employer': {
        const aid = Number(el.dataset.aid);
        const stars = Number(el.dataset.stars);
        const a = Store.getAssignment(aid);
        if (!a || a.rated) { toast('Уже оценено'); return; }
        a.rated = true;
        a.rating = stars;
        Store.addRating('employer', stars);
        Store.save();
        toast('Спасибо! Оценка ' + stars + '/5');
        vibrate();
        /* после оставления отзыва удаляем чат с работодателем, чтобы не засорять */
        if (Store.useApi() && window.Api && a.taskId) {
          const t = Store.getTask(a.taskId);
          if (t && t.employerId) {
            Api.findChatByTask(Number(a.taskId), Number(Store.getUser().id)).then(function (chats) {
              if (chats && chats.length) {
                Api.deleteChat(chats[0].id).catch(function () {});
              }
            });
          }
        }
        navigate('my-task-detail', { aid: aid });
        break;
      }
      case 'take-task': {
        const taskId = Number(el.dataset.id);
        const t = Store.getTask(taskId);
        if (!t) return;
        if (t.spotsLeft <= 0) { toast('Места закончились!', true); return; }
        const u = Store.getUser();

        if (Store.useApi() && window.Api) {
          Api.takeTask(taskId, u).then(function (resp) {
            if (!resp) { toast('Не удалось взять задание', true); return; }
            toast('Задание взято!');
            vibrate();
            /* сразу кладём отклик в Store, чтобы кнопка «Взять задание» исчезла мгновенно */
            Store.addAssignment({
              id: Number(resp.id),
              taskId: taskId,
              userId: u.id,
              userName: u.name,
              status: resp.status || 'in_progress',
              reward: resp.reward || t.reward || 0,
              takenAt: Date.now(),
              proofType: null,
              proofData: null,
              rejectionReason: null
            });
            /* открываем чат с работодателем и показываем системную плашку
               «Исполнитель взялся за задание» (как на FunPay) */
            Api.startChat(taskId, Number(t.employerId), Number(u.id)).then(function (chat) {
              if (chat) {
                /* системное сообщение с деталями заказа */
                Promise.all([
                  Api.getUserInfo(Number(t.employerId)),      /* работодатель */
                  Api.getMyUid(Number(u.id))                   /* исполнитель */
                ]).then(function (info) {
                  const emp = info && info[0] ? info[0] : null;
                  const myUid = info && info[1] ? info[1] : null;
                  const text =
                    '⚙️ <b>Исполнитель взялся за задание</b>\n\n' +
                    '📋 Заказ № ' + taskId + '\n' +
                    '💼 <b>' + Api._esc(t.title) + '</b>\n' +
                    '💰 Награда: ' + fmtMoney(t.reward) + '\n' +
                    '──────────\n' +
                    '🧑‍💼 Работодатель: <b>' + Api._esc(t.employerName || '—') + '</b>' + (emp && emp.uid ? ' (UID ' + esc(emp.uid) + ')' : '') + '\n' +
                    '🔨 Исполнитель: <b>' + Api._esc(u.name || '—') + '</b>' + (myUid ? ' (UID ' + esc(myUid) + ')' : '') + '\n' +
                    '──────────\n' +
                    'Когда выполните задание — отправьте подтверждение в этом чате.';
                  Api.sendMessage(chat.id, Number(u.id), text, u.name).catch(function(){});
                  navigate('chat-detail', { id: chat.id, system: text });
                }).catch(function () {
                  Api.sendMessage(chat.id, Number(u.id), '⚙️ <b>Исполнитель взялся за задание</b>', u.name).catch(function(){});
                  navigate('chat-detail', { id: chat.id, system: '⚙️ Исполнитель взялся за задание' });
                });
              } else {
                Store.syncFromApi().then(() => navigate('my-task-detail', { aid: resp.id }));
              }
            }).catch(function () {
              Store.syncFromApi().then(() => navigate('my-task-detail', { aid: resp.id }));
            });
          }).catch(function () {
            toast('Ошибка взятия задания', true);
          });
          return;
        }

        const a = {
          id: Store.nextId('assignments'),
          taskId: taskId,
          userId: u.id,
          userName: u.name,
          status: 'in_progress',
          reward: t.reward,
          takenAt: Date.now(),
          proofType: null,
          proofData: null,
          rejectionReason: null
        };
        Store.getAssignments().push(a);
        t.spotsLeft = Math.max(0, t.spotsLeft - 1);
        Store.save();
        toast('Задание взято! Подробности в профиле → Мои задания');
        vibrate();
        if (Store.useApi() && window.Api) {
          Api.startChat(taskId, Number(t.employerId), Number(u.id)).catch(function(){});
          Api.sendMessageToTask && Api.sendMessageToTask(taskId, Number(u.id), 'Здравствуйте! Хочу выполнить ваше задание «' + t.title + '»').catch(function(){});
        }
        navigate('my-task-detail', { aid: a.id });
        break;
      }
      case 'select-proof': {
        const parent = el.closest('.opt-row');
        if (parent) {
          parent.querySelectorAll('[data-proof]').forEach(x => x.classList.remove('active'));
          el.classList.add('active');
        }
        break;
      }
      case 'submit-proof': {
        const aid = Number(el.dataset.aid);
        const a = Store.getAssignment(aid);
        if (!a) return;
        const text = $('proof-text') ? $('proof-text').value : '';
        const comment = $('proof-comment') ? $('proof-comment').value : '';
        const card = el.closest('.card');
        const activeProof = card ? card.querySelector('[data-proof].active') : null;
        if (!activeProof && !text) { toast('Выберите тип подтверждения', true); return; }
        a.status = 'pending';
        a.proofType = activeProof ? activeProof.dataset.proof : 'text';
        a.proofData = text || comment || 'отправлено';
        a.proofComment = comment || '';
        Store.save();

        /* в Supabase-режиме пишем статус в БД — иначе работодатель не увидит */
        if (Store.useApi() && window.Api) {
          Api.updateAssignment(aid, {
            status: 'pending',
            proof_type: a.proofType,
            comment: comment || text || ''
          }).then(function (upd) {
            if (!upd) { toast('Не удалось отправить в базу', true); return; }
            /* уведомить работодателя: исполнитель отправил на проверку */
            const t = Store.getTask(a.taskId);
            const meU = Store.getUser() || {};
            if (t && t.employerId && window.Api._notify) {
              Api._notify(t.employerId, '📨 <b>' + Api._esc(meU.name || 'Исполнитель') + '</b> отправил выполнение задания <b>' + Api._esc(t.title) + '</b> на проверку');
            }
            /* карточка заказа в чате: плашка с кнопками Подтвердить/Отклонить */
            if (t && t.employerId && Api.findChatByTask) {
              Api.findChatByTask(Number(t.id), Number(meU.id)).then(function (chats) {
                if (chats && chats.length) {
                  const msg = '[ORDER]' + aid + '|' + t.employerId + '|🔔 Исполнитель <b>' + Api._esc(meU.name || '—') + '</b> отправил задание на проверку\n\n' +
                    '📋 Заказ № ' + t.id + '\n💼 <b>' + Api._esc(t.title) + '</b>\n💰 Награда: ' + fmtMoney(t.reward);
                  Api.sendMessage(chats[0].id, Number(meU.id), msg, meU.name).catch(function () {});
                }
              });
            }
          }).catch(function () { toast('Ошибка отправки', true); });
        }

        toast('Отправлено на проверку!');
        vibrate('medium');
        navigate('my-task-detail', { aid: aid });
        break;
      }
      case 'retry-task': {
        const aid = Number(el.dataset.aid);
        const a = Store.getAssignment(aid);
        if (!a) return;
        a.status = 'in_progress';
        a.proofType = null;
        a.proofData = null;
        a.rejectionReason = null;
        Store.save();
        navigate('my-task-detail', { aid: aid });
        break;
      }
      case 'publish-task': {
        const title = $('f-title');
        const desc = $('f-desc');
        const cat = $('f-cat');
        const platform = $('f-platform');
        const spots = $('f-spots');
        const reward = $('f-reward');
        const instruction = $('f-instruction');
        const deadline = $('f-deadline');
        if (!title || !title.value.trim() || !desc.value.trim() || !instruction.value.trim()) {
          toast('Заполните все обязательные поля', true);
          vibrate('heavy');
          return;
        }
        const s = parseInt(spots.value) || 0;
        const r = parseInt(reward.value) || 0;
        if (s < 1 || r < 1) { toast('Некорректное количество или оплата', true); return; }
        const selectedProofs = [];
        document.querySelectorAll('[data-proof].active').forEach(el2 => selectedProofs.push(el2.dataset.proof));
        if (selectedProofs.length === 0) { toast('Выберите тип подтверждения', true); return; }
        const hasSub = Store.hasActiveSubscription();
        const userTasks = Store.getTasks().filter(t => t.employerId === Store.getUser().id && t.status === 'active');
        if (!hasSub && userTasks.length >= 1) {
          toast('Бесплатно — только 1 задание. Купите подписку', true);
          navigate('subs');
          return;
        }
        const totalBudget = s * r;
        const task = {
          title: title.value.trim(),
          description: desc.value.trim(),
          category: cat.value,
          platform: platform.value,
          spotsTotal: s,
          spotsLeft: s,
          reward: r,
          durationMin: 10,
          instruction: instruction.value.trim(),
          proof: selectedProofs,
          employerId: Store.getUser().id,
          employerName: Store.getUser().name,
          deadlineDays: parseInt(deadline.value) || 7
        };

        /* если бэкенд настроен — публикуем в Supabase (задание увидят все) */
        if (Store.useApi() && window.Api) {
          Api.publishTask({
            title: task.title,
            description: task.description,
            category: task.category,
            platform: task.platform,
            reward: task.reward,
            spots_total: task.spotsTotal,
            spots_left: task.spotsTotal,
            duration_min: task.durationMin,
            instruction: task.instruction,
            proof: task.proof,
            employer_id: task.employerId,
            employer_name: task.employerName,
            deadline_days: task.deadlineDays,
            status: 'active'
          }).then(function (res) {
            if (res && res.error) {
              toast((res.error) || 'Ошибка публикации', true);
              vibrate('heavy');
              return;
            }
            toast('Задание отправлено на модерацию! Бюджет ' + fmtMoney(totalBudget) + ' заморожен');
            vibrate();
            Store.syncFromApi().then(() => navigate('tasks'));
          }).catch(function () {
            toast('Ошибка публикации', true);
          });
          return;
        }

        Store.addTask(task);
        Store.data.employersCount += 1;
        Store.save();
        toast('Задание опубликовано! Бюджет ' + fmtMoney(totalBudget));
        vibrate();
        navigate('tasks');
        break;
      }
      case 'buy-sub': {
        const planId = el.dataset.plan;
        const plan = SUBSCRIPTIONS.find(p => p.id === planId);
        if (!plan) return;
        const bal = Store.getBalance();
        if (bal < plan.price) { toast('Недостаточно средств на балансе', true); navigate('wallet'); return; }
        tgConfirm('Подписка', 'Оплатить ' + fmtMoney(plan.price) + ' за тариф «' + plan.name + '»?').then(ok => {
          if (!ok) return;
          const res = Store.activateSubscription(planId);
          if (!res.ok) { toast(res.error, true); return; }
          toast('Подписка «' + plan.name + '» активирована!');
          vibrate();
          navigate('subs');
        });
        break;
      }
      case 'pay-out': {
        const bal = Store.getBalance();
        if (bal < 10) { toast('Минимум 10 ₽ для вывода', true); return; }
        if (Store.useApi() && window.Api) {
          tgConfirm('Вывод', 'Создать заявку на вывод ' + fmtMoney(bal) + '? (выплата вручную)').then(ok => {
            if (!ok) return;
            Api.requestPayout(Number(Store.getUser().id), bal).then(function (res) {
              if (res === 'OK') {
                toast('Заявка на вывод создана!');
                Store.syncFromApi().then(() => navigate('wallet'));
              } else {
                toast('Ошибка вывода: ' + (res && res.error ? res.error : res), true);
              }
            });
          });
          return;
        }
        tgPopup('Вывод средств', 'В полной версии здесь будет интеграция с платёжной системой (ЮMoney, СБП и др.). Сейчас баланс: ' + fmtMoney(bal));
        break;
      }
      case 'confirm-assignment': {
        if (!Store.useApi() || !window.Api) return;
        const aid = Number(el.dataset.aid);
        tgConfirm('Подтвердить', 'Подтвердить выполнение и выплатить награду исполнителю?').then(ok => {
          if (!ok) return;
          Api.confirmAssignment(aid, Number(Store.getUser().id)).then(function (res) {
            if (res && res.ok) {
              toast('Выполнение подтверждено, награда начислена!');
              vibrate();
              /* ответная плашка в чат — от РЕАЛЬНОГО работодателя задания,
                 даже если подтвердил админ (иначе плашка уходит от неправильного юзера) */
              const t = Store.getTask(res.task_id != null ? res.task_id : aid);
              const empId = res.employer_id != null ? Number(res.employer_id) : (t ? Number(t.employerId) : 0);
              const title = t ? t.title : ('#' + (res.task_id || aid));
              const sendToChat = function (chats) {
                if (chats && chats.length) {
                  Api.sendMessage(chats[0].id, empId,
                    '✅ Работодатель подтвердил заказ №' + (res.task_id != null ? res.task_id : aid) + '\n' +
                    '💼 ' + title + '\n' +
                    '💰 Награда ' + fmtMoney(res.reward) + ' начислена исполнителю',
                    (Store.getTask(res.task_id) ? Store.getTask(res.task_id).employerName : 'Работодатель')).catch(function () {});
                }
              };
              if (res.task_id != null && Api.findChatByTaskAny) {
                Api.findChatByTaskAny(Number(res.task_id)).then(sendToChat);
              }
              Store.syncFromApi().then(() => navigate('home'));
            } else {
              toast((res && res.error) || 'Ошибка подтверждения', true);
            }
          });
        });
        break;
      }
      case 'reject-assignment': {
        if (!Store.useApi() || !window.Api) return;
        const aid = Number(el.dataset.aid);
        Api.rejectAssignment(aid, Number(Store.getUser().id)).then(function (res) {
          if (res) {
            toast('Выполнение отклонено');
            /* ответная плашка в чат */
            const t = Store.getTask(res.task_id != null ? res.task_id : aid);
            const meU = Store.getUser() || {};
            if (t && t.employerId && Api.findChatByTask) {
              Api.findChatByTask(Number(t.id), Number(meU.id)).then(function (chats) {
                if (chats && chats.length) {
                  Api.sendMessage(chats[0].id, Number(meU.id),
                    '⚙️ Заказ № ' + t.id + ' отклонён работодателем ❌',
                    meU.name).catch(function () {});
                }
              });
            }
            Store.syncFromApi().then(() => navigate('home'));
          } else {
            toast('Ошибка отклонения', true);
          }
        });
        break;
      }
      case 'admin-panel': {
        navigate('admin');
        break;
      }
      case 'admin-find-uid': {
        const input = $('admin-uid-input');
        const uid = input ? input.value.trim().toUpperCase() : '';
        const box = $('admin-user-result');
        if (!uid) { toast('Введите UID'); return; }
        if (!box) return;
        _adminUid = uid;
        box.innerHTML = '<div style="font-size:13px;color:var(--text-3);padding:8px">Поиск...</div>';
        Api.adminFindUser(uid).then(function (found) {
          if (uid !== _adminUid) return;
          box.innerHTML = adminUserCard(found);
        }).catch(function () {
          if (uid !== _adminUid) return;
          box.innerHTML = adminUserCard(null);
        });
        vibrate();
        break;
      }
      case 'admin-give':
      case 'admin-take':
      case 'admin-set-balance':
      case 'admin-set-block':
      case 'admin-set-admin':
      case 'admin-set-unlimited':
      case 'admin-set-verified': {
        const box = $('admin-user-result');
        if (!_adminUid) { toast('Сначала найдите пользователя по UID', true); return; }
        Api.adminFindUser(_adminUid).then(function (u) {
          if (!u) { toast('Пользователь не найден', true); return; }
          const op = action;
          const run = function () {
            const amt = parseInt(($('admin-amount') || {}).value, 10) || 0;
            const balVal = parseInt(($('admin-balance-set') || {}).value, 10) || 0;
            let p = null;
            if (op === 'admin-give') {
              p = Api.adminGiveMoney(u.id, amt);
            } else if (op === 'admin-take') {
              p = Api.adminTakeMoney(u.id, amt);
            } else if (op === 'admin-set-balance') {
              if (!balVal) { toast('Укажите сумму', true); return; }
              p = Api.adminSetBalance(u.id, balVal);
            } else if (op === 'admin-set-block') {
              p = Api.adminSetBlocked(u.id, el.dataset.blocked === '1');
            } else if (op === 'admin-set-admin') {
              p = Api.adminSetAdmin(u.id, el.dataset.admin === '1');
            } else if (op === 'admin-set-unlimited') {
              p = Api.adminSetUnlimited(u.id, el.dataset.unlim === '1');
            } else if (op === 'admin-set-verified') {
              p = Api.adminSetVerified(u.id, el.dataset.verified === '1');
            }
            if (!p) { toast('Ошибка операции', true); return; }
            p.then(function (res) {
              if (res && res.ok) {
                const msgs = {
                  'admin-give': 'Начислено ' + fmtMoney(amt) + ' ✓',
                  'admin-take': 'Списано ' + fmtMoney(amt) + ' ✓',
                  'admin-set-balance': 'Баланс установлен ✓',
                  'admin-set-block': el.dataset.blocked === '1' ? 'Пользователь заблокирован 🔒' : 'Пользователь разблокирован 🔓',
                  'admin-set-admin': el.dataset.admin === '1' ? 'Права админа выданы ⚙' : 'Права админа сняты',
                  'admin-set-unlimited': el.dataset.unlim === '1' ? 'Лимит публикаций снят 🔓' : 'Лимит публикаций возвращён',
                  'admin-set-verified': el.dataset.verified === '1' ? 'Галочка верификации поставлена ✔' : 'Галочка верификации снята'
                }[op];
                toast(msgs || 'Готово');
                vibrate();
                Api.adminFindUser(_adminUid).then(function (u2) {
                  if (u2) box.innerHTML = adminUserCard(u2);
                });
              } else {
                toast((res && res.error) || 'Ошибка', true);
              }
            });
          };
          if (op === 'admin-give' || op === 'admin-take' || op === 'admin-set-balance') {
            tgConfirm('Подтвердите', 'Выполнить операцию для ' + esc(u.name || 'пользователя') + '?').then(function (ok) {
              if (ok) run();
            });
          } else {
            run();
          }
        });
        break;
      }
      case 'admin-delete-task': {
        const id = Number(el.dataset.id);
        if (!id) { toast('Нет данных задания', true); return; }
        tgConfirm('Удалить задание', 'Удалить задание с биржи? Это действие нельзя отменить.').then(function (ok) {
          if (!ok) return;
          Api.adminDeleteTask(id).then(function (res) {
            if (res && res.ok) {
              toast('Задание удалено');
              vibrate();
              /* удаляем карточку на месте — экран не перезагружаем,
                 чтобы админа не сбрасывало в начало списка */
              const card = el.closest('.card');
              if (card) card.remove();
              Store.syncFromApi().catch(function () {});
            } else {
              toast('Ошибка удаления', true);
            }
          });
        });
        break;
      }
      case 'admin-broadcast': {
        const ta = $('admin-broadcast-text');
        const msg = ta ? ta.value.trim() : '';
        if (!msg) { toast('Введите текст уведомления', true); return; }
        tgConfirm('Рассылка', 'Отправить это сообщение всем пользователям бота?').then(function (ok) {
          if (!ok) return;
          Api.adminBroadcast(msg).then(function (res) {
            if (res && res.ok) {
              toast('Сообщение отправлено всем');
              if (ta) ta.value = '';
              vibrate();
            } else {
              toast((res && res.error) || 'Ошибка рассылки', true);
            }
          });
        });
        break;
      }
      case 'admin-create-promo': {
        const code = ($('admin-promo-code') || {}).value || '';
        const bonus = parseInt(($('admin-promo-bonus') || {}).value, 10) || 0;
        const uses = parseInt(($('admin-promo-uses') || {}).value, 10) || 1;
        if (!code) { toast('Введите код промокода', true); return; }
        if (bonus <= 0) { toast('Бонус должен быть больше 0', true); return; }
        Api.adminCreatePromocode(code, bonus, uses).then(function (res) {
          if (res && res.id) {
            toast('Промокод создан');
            vibrate();
            navigate('admin');
          } else {
            toast((res && res.error) || 'Ошибка создания', true);
          }
        });
        break;
      }
      case 'admin-delete-promo': {
        const id = Number(el.dataset.id);
        tgConfirm('Удалить промокод', 'Удалить промокод?').then(function (ok) {
          if (!ok) return;
          Api.adminDeletePromocode(id).then(function (res) {
            toast(res && res.ok ? 'Промокод удалён' : 'Ошибка удаления', !(res && res.ok));
            if (res && res.ok) navigate('admin');
          });
        });
        break;
      }
      case 'admin-complaint-close': {
        const id = Number(el.dataset.id);
        Api.adminDeleteComplaint(id).then(function (res) {
          toast(res && res.ok ? 'Жалоба закрыта' : 'Ошибка', !(res && res.ok));
          if (res && res.ok) {
            const card = el.closest('.card');
            if (card) card.remove();
          }
        });
        break;
      }
      case 'admin-moderate': {
        const id = Number(el.dataset.id);
        const dec = el.dataset.dec;
        if (!id || !dec) { toast('Нет данных задания', true); return; }
        const label = dec === 'approve' ? 'Выпустить задание на биржу?' : 'Отклонить задание?';
        tgConfirm('Модерация', label).then(function (ok) {
          if (!ok) return;
          Api.moderateTask(id, dec).then(function (upd) {
            if (upd) {
              toast(dec === 'approve' ? 'Задание выпущено на биржу ✓' : 'Задание отклонено');
              vibrate();
              Store.syncFromApi().then(function () { navigate('admin'); });
            } else {
              toast('Ошибка модерации', true);
            }
          });
        });
        break;
      }
      case 'admin-confirm-assign': {
        const aid = Number(el.dataset.aid);
        const employerId = Number(el.dataset.employer);
        if (!aid || !employerId) { toast('Нет данных отклика', true); return; }
        tgConfirm('Подтвердить', 'Подтвердить выполнение и выплатить награду исполнителю?').then(function (ok) {
          if (!ok) return;
          Api.confirmAssignment(aid, employerId).then(function (res) {
            if (res && res.ok) {
              toast('Выполнение подтверждено, награда начислена!');
              vibrate();
              /* плашка в чат — от реального работодателя */
              const t = Store.getTask(res.task_id != null ? res.task_id : aid);
              const title = t ? t.title : ('#' + (res.task_id || aid));
              const empName = t ? t.employerName : 'Работодатель';
              if (res.task_id != null && Api.findChatByTaskAny) {
                Api.findChatByTaskAny(Number(res.task_id)).then(function (chats) {
                  if (chats && chats.length) {
                    Api.sendMessage(chats[0].id, employerId,
                      '✅ Работодатель подтвердил заказ №' + (res.task_id || aid) + '\n' +
                      '💼 ' + title + '\n' +
                      '💰 Награда ' + fmtMoney(res.reward) + ' начислена исполнителю',
                      empName).catch(function () {});
                  }
                });
              }
              Store.syncFromApi().then(function () { navigate('admin'); });
            } else {
              toast((res && res.error) || 'Ошибка подтверждения', true);
            }
          });
        });
        break;
      }
      case 'save-prices': {
        document.querySelectorAll('.admin-price').forEach(inp => {
          const plan = SUBSCRIPTIONS.find(p => p.id === inp.dataset.plan);
          if (plan) plan.price = parseInt(inp.value) || plan.price;
        });
        toast('Цены сохранены!');
        vibrate();
        break;
      }
      case 'refresh-data': {
        vibrate();
        if (!Store.useApi()) { toast('Нет данных для обновления'); return; }
        toast('Обновляю...');
        Store.syncFromApi().then((ok) => {
          navigate(TaskPay.currentRoute() || 'home');
          toast(ok ? 'Данные обновлены' : 'Не удалось обновить', !ok);
        });
        break;
      }
      case 'refresh-wallet': {
        navigate('wallet');
        break;
      }
      case 'retry-chats': {
        navigate('chats');
        break;
      }
      case 'redeem-promo': {
        const inp = $('promo-input');
        const code = inp ? inp.value.trim().toUpperCase() : '';
        const box = $('promo-result');
        if (!code) { toast('Введите промокод', true); return; }
        Api.redeemPromocode(code, Number(Store.getUser().id)).then(function (res) {
          if (!box) return;
          if (res && res.ok) {
            box.innerHTML = '<div style="font-size:13px;color:var(--green);font-weight:600;margin-top:8px">✓ Промокод активирован: +' + fmtMoney(res.bonus) + ' на баланс</div>';
            if (inp) inp.value = '';
            Store.syncFromApi().then(function () { navigate('profile'); });
          } else {
            box.innerHTML = '<div style="font-size:13px;color:var(--red);margin-top:8px">' + esc((res && res.error) || 'Ошибка') + '</div>';
          }
        });
        break;
      }
      case 'apply-referral': {
        const inp = $('ref-input');
        const code = inp ? inp.value.trim().toUpperCase() : '';
        const box = $('ref-result');
        if (!code) { toast('Введите реферальный код', true); return; }
        Api.applyReferral(Number(Store.getUser().id), code).then(function (res) {
          if (!box) return;
          if (res && res.ok) {
            box.innerHTML = '<div style="font-size:13px;color:var(--green);font-weight:600;margin-top:8px">✓ Код активирован: +' + fmtMoney(res.bonus) + ' вам и пригласившему 🤝</div>';
            if (inp) inp.value = '';
            Store.syncFromApi().then(function () { navigate('profile'); });
          } else {
            box.innerHTML = '<div style="font-size:13px;color:var(--red);margin-top:8px">' + esc((res && res.error) || 'Ошибка') + '</div>';
          }
        });
        break;
      }
      case 'toggle-cat-sub': {
        const cat = el.dataset.cat;
        const u = Store.getUser();
        const arr = (u.subscribed_categories || []).slice();
        const idx = arr.indexOf(cat);
        if (idx !== -1) arr.splice(idx, 1); else arr.push(cat);
        el.classList.toggle('active', idx !== -1);
        Api.setCategorySubs(Number(u.id), arr).then(function (res) {
          if (res) {
            u.subscribed_categories = arr;
            Store.save();
          }
        });
        break;
      }
    }
  }

  /* ---------- Экспорт ---------- */
  window.TaskPayScreens = {
    init: function () {},
    runAction: runAction
  };

/* Глобальный click-делегат — единственный обработчик кликов.
   Работает и для динамических элементов (чаты, результат поиска UID, отклики).
   Дебаунс 400мс по тому же элементу — защита от двойного тапа (две кнопки
   «выполнить» срабатывали бы дважды и создавали дубль отклика). */
  let _lastClickEl = null;
  let _lastClickTime = 0;
  document.addEventListener('click', function (e) {
    const el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el || !el.dataset || !el.dataset.action) return;
    const now = Date.now();
    if (el === _lastClickEl && now - _lastClickTime < 400) return;
    _lastClickEl = el;
    _lastClickTime = now;
    try {
      runAction(el);
    } catch (err) {
      console.error('runAction error', err);
      toast('Ошибка: ' + (err && err.message ? err.message : err) + ' — проверьте консоль', true);
    }
  });
})();