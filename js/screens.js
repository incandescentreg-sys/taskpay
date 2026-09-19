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
      <div class="brand">
        <img src="logo.jpg" alt="Yumitask" class="logo">
        <h1>Yumitask</h1>
        <div class="tagline">Выполняй задания — получай деньги<br>Размещай задания — получай результат</div>
      </div>

      <div class="bourse-wrap">
        <button class="bourse-btn" data-action="navigate" data-page="tasks">
          <span class="bb-ico">⚡</span>
          <span><span class="bb-label">Биржа заданий</span><span class="bb-sub">Открыть задания</span></span>
        </button>
      </div>

      <div class="grid-menu">
        <div class="menu-card" data-action="navigate" data-page="create">
          <div class="mc-ico" style="background:var(--blue-soft)">💼</div>
          <div class="mc-label">Разместить задание</div>
          <div class="mc-sub">Найди исполнителей</div>
        </div>
        <div class="menu-card menu-card--green" data-action="navigate" data-page="wallet">
          <div class="mc-ico" style="background:var(--green-soft)">💰</div>
          <div class="mc-label">Мой баланс</div>
          <div class="mc-sub">${fmtMoney(Store.getBalance())}</div>
        </div>
        <div class="menu-card menu-card--amber" data-action="navigate" data-page="subs">
          <div class="mc-ico" style="background:var(--amber-soft)">📢</div>
          <div class="mc-label">Продвижение</div>
          <div class="mc-sub">Тарифы работодателя</div>
        </div>
        ${isAdmin() ? `
        <div class="menu-card menu-card--amber" data-action="navigate" data-page="admin">
          <div class="mc-ico" style="background:var(--red-soft)">⚙️</div>
          <div class="mc-label">Админ-панель</div>
          <div class="mc-sub">Управление</div>
        </div>` : ''}
      </div>

      <div class="section-title">Статистика платформы</div>
      <div class="stats">
        ${statCard(stats.activeTasks, 'Активных заданий', 'green')}
        ${statCard(stats.doneTasks, 'Выполнено заданий', 'blue')}
        ${statCard(fmtMoney(stats.earned), 'Заработано пользователями', 'amber')}
        ${statCard(stats.employers + '', 'Работодателей', 'accent')}
      </div>

      ${!hasSub ? `
      <div class="cta-banner">
        <div class="cb-title">🚀 Хотите привлечь клиентов, подписчиков или получить отзывы?</div>
        <div class="cb-text">Разместите своё задание и получите реальных исполнителей.</div>
        <button class="btn btn--block" data-action="navigate" data-page="subs">Стать работодателем</button>
      </div>` : ''}

      ${bottomNav('home')}
    </div>`;
  }, () => { /* bind в глобальном обработчике */ });

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
      '<span class="tag' + (cat === id ? ' active' : '') + '" data-action="filter-cat" data-cat="' + id + '">' + name + '</span>';
    const platHTML = (id, name) =>
      '<span class="tag' + (platform === id ? ' active' : '') + '" data-action="filter-platform" data-platform="' + id + '">' + name + '</span>';
    const sortHTML = (id, name) =>
      '<span class="tag' + (sort === id ? ' active' : '') + '" data-action="filter-sort" data-sort="' + id + '">' + name + '</span>';

    return `
    ${topbar('🔍 Найти задания', { back: false })}
    <div class="page">
      <div class="section-title">Платформа</div>
      <div class="tag-row">${platHTML('all', 'Все')}${PLATFORMS.map(p => platHTML(p.id, p.icon + ' ' + p.name)).join('')}</div>
      <div class="section-title">Категории</div>
      <div class="tag-row">${catHTML('all', 'Все')}${CATEGORIES.map(c => catHTML(c.id, c.icon + ' ' + c.name)).join('')}</div>
      <div class="section-title">Сортировка</div>
      <div class="tag-row">${['new','pay','popular'].map(s => {
        const names = { new: '⭐ Новые', pay: '💰 По оплате', popular: '🔥 Популярные' };
        return sortHTML(s, names[s]);
      }).join('')}</div>
      ${tasks.length === 0 ? '<div class="empty"><div class="e-ico">📭</div><div class="e-title">Нет доступных заданий</div><div class="e-sub">Скоро появятся новые задачи</div></div>' :
        tasks.map(t => taskCardHTML(t)).join('')}
    </div>
    ${bottomNav('tasks')}`;
  }, () => {});

  /* ================================================================
     TASK DETAIL — страница одного задания
  ================================================================ */
  register('task-detail', (s) => {
    const t = Store.getTask(s.id);
    if (!t) return '<div class="page"><div class="empty"><div class="e-ico">❌</div><div class="e-title">Задание не найдено</div></div></div>';
    const cat = Category.byId(t.category);
    const pl = t.platform ? Platform.byId(t.platform) : null;
    const rating = Store.getTaskEmployerRating(t);
    return `
    ${topbar(t.title)}
    <div class="page">
      <div class="card" style="margin-bottom:16px;">
        <div class="section-title" style="margin-top:0">${esc(t.title)}</div>
        <div class="tc-chips" style="margin-bottom:12px">
          ${pl ? '<span class="chip chip--blue">' + pl.icon + ' ' + esc(pl.name) + '</span>' : ''}
          <span class="chip chip--accent">🏷 ${esc(cat.name)}</span>
          <span class="chip chip--green">💰 ${fmtMoney(t.reward)} за исполнителя</span>
          <span class="chip chip--amber">👥 Осталось: ${t.spotsLeft} мест</span>
          <span class="chip chip--blue">⏱ ~${t.durationMin} мин</span>
        </div>
        <p style="font-size:14px;line-height:1.55;color:var(--text-2);margin:10px 0 16px">${esc(t.description)}</p>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:6px">Работодатель: ${esc(t.employerName || '—')} ${starsHTML(rating)} <b style="color:var(--accent-2)">${rating.score}</b> · ${rating.count} оценок</div>
        <div style="font-size:13px;color:var(--text-3)">Создано: ${timeAgo(t.createdAt)} · Срок: до ${t.deadlineDays} дн</div>
      </div>

      <div class="section-title">📋 Инструкция</div>
      <div class="card">
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--text-2)">${esc(t.instruction)}</p>
      </div>

      <div class="section-title">📎 Подтверждение выполнения</div>
      <div class="card">
        <div class="tc-chips">${proofChips(t.proof)}</div>
        <div style="font-size:13px;color:var(--text-3);margin-top:8px">Вы должны предоставить указанные доказательства.</div>
      </div>

      <button class="btn btn--block" style="margin-top:20px" data-action="take-task" data-id="${t.id}">📥 Взять задание</button>
    </div>
    ${bottomNav('tasks')}`;
  }, () => {});

  /* ================================================================
     TAKE TASK (после взятия) — с формой отправки
  ================================================================ */
  register('my-task-detail', (s) => {
    const a = Store.getAssignment(s.aid);
    if (!a) return '<div class="page"><div class="empty"><div class="e-title">Задание не найдено</div></div></div>';
    const t = Store.getTask(a.taskId);
    const cat = t ? Category.byId(t.category) : null;

    const proofOptsHTML = t && t.proof ? t.proof.map(p => {
      const icon = { screenshot: '📸', link: '🔗', text: '💬', multiple: '🗂', other: '📎' }[p] || '📎';
      const name = Proof.byId(p).name;
      return '<label class="verify-opt" data-action="select-proof" data-proof="' + p + '">' +
        '<span class="vo-ico">' + icon + '</span>' +
        '<span class="vo-label">' + name + '</span>' +
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
            <span style="font-size:24px">🟡</span>
            <div><div style="font-weight:700">На проверке</div>
            <div style="font-size:13px;color:var(--text-2)">Работодатель проверяет ваше выполнение</div></div>
          </div>
        </div>
      ` : a.status === 'done' ? `
        <div class="card" style="background:var(--green-soft);border-color:var(--green)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🟢</span>
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
            <span style="font-size:24px">🔴</span>
            <div><div style="font-weight:700">Отклонено</div>
            <div style="font-size:13px;color:var(--text-2)">${a.rejectionReason || 'Работодатель отклонил выполнение'}</div></div>
          </div>
        </div>
      ` : ''}

      ${t ? `
      <div class="card">
        <div style="font-size:13px;color:var(--text-2);margin-bottom:8px">📋 Инструкция</div>
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--text);">${esc(t.instruction)}</p>
      </div>` : ''}

      ${a.status === 'in_progress' ? `
        <div class="section-title">📎 Подтверждение выполнения</div>
        <div class="card">
          <div class="opt-row">${proofOptsHTML}</div>
          ${multiHelp}
          <div class="field" style="margin-top:12px">
            <label>Комментарий (необязательно)</label>
            <textarea id="proof-comment" rows="2" placeholder="Дополнительные пояснения..."></textarea>
          </div>
          <button class="btn btn--block btn--green" data-action="submit-proof" data-aid="${a.id}" style="margin-top:8px">📤 Отправить на проверку</button>
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
    ${topbar('💼 Разместить задание')}
    <div class="page">
      <div class="field">
        <label>Название задания <span class="req">*</span></label>
        <input id="f-title" maxlength="100" placeholder="Например: Напишите отзыв о нашем ресторане">
      </div>
      <div class="field">
        <label>Описание <span class="req">*</span></label>
        <textarea id="f-desc" rows="2" placeholder="Посетите страницу ресторана, ознакомьтесь с информацией и выполните указанное действие."></textarea>
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
      <div class="field">
        <label>Инструкция для исполнителя <span class="req">*</span></label>
        <textarea id="f-instruction" rows="5" placeholder="Подробно опишите, что нужно сделать и как подтвердить выполнение."></textarea>
      </div>
      <div class="field">
        <label>Подтверждение выполнения <span class="req">*</span></label>
        <div class="opt-row" id="proof-opts">${PROOF_TYPES.map(p => {
          const icon = { screenshot: '📸', link: '🔗', text: '💬', multiple: '🗂', other: '📎' }[p.id] || '📎';
          return '<span class="opt" data-proof="' + p.id + '">' + icon + ' ' + p.name + '</span>';
        }).join('')}</div>
        <div class="hint">Выберите один или несколько вариантов</div>
      </div>
      <div class="field">
        <label>Срок выполнения (дней)</label>
        <input id="f-deadline" type="number" min="1" max="365" value="7">
      </div>
      <button class="btn btn--block" data-action="publish-task" style="margin-top:8px">📢 Опубликовать задание</button>
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
    ${topbar('📢 Продвижение')}
    <div class="page">
      <div class="cta-banner" style="margin-bottom:22px">
        <div class="cb-title">🚀 Хотите привлечь клиентов, подписчиков или получить отзывы?</div>
        <div class="cb-text">Разместите своё задание и получите реальных исполнителей.</div>
      </div>

      ${hasSub ? `
      <div class="card" style="background:var(--green-soft);border-color:var(--green);text-align:center;margin-bottom:18px">
        <div style="font-size:22px">✅</div>
        <div style="font-weight:700;margin:8px 0 4px">Подписка активна</div>
        <div style="font-size:13px;color:var(--text-2)">Действует до ${fmtDate(sub.until)}</div>
      </div>` : ''}

      <div class="subs-grid">
        ${SUBSCRIPTIONS.map(p => `
        <div class="sub-card${p.hot ? ' sub-card--hot' : ''}">
          ${p.hot ? '<div class="sub-badge">🔥 Популярное</div>' : ''}
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
    const txns = Store.data.transactions;
    return `
    ${topbar('💰 Мой баланс')}
    <div class="page">
      <div class="balance-card">
        <div class="b-label">Доступно</div>
        <div class="b-value">${bal.toLocaleString('ru-RU')} <small>₽</small></div>
        <div class="wallet-actions">
          <button class="btn btn--green btn--sm btn--block" data-action="pay-out">💳 Вывести</button>
          <button class="btn btn--ghost btn--sm btn--block" data-action="navigate" data-page="subs">📢 Потратить</button>
        </div>
      </div>

      <div class="section-title">История операций <span class="link" data-action="refresh-wallet">⟳</span></div>
      ${txns.length === 0 ? '<div class="empty"><div class="e-ico">📭</div><div class="e-title">Нет операций</div></div>' :
        txns.map(t => `
        <div class="op">
          <div class="op-ico">${t.type === 'income' ? '📥' : '📤'}</div>
          <div class="op-body">
            <div class="op-title">${esc(t.title)}</div>
            <div class="op-date">${timeAgo(t.date)}</div>
          </div>
          <div class="op-amount ${t.type === 'income' ? 'plus' : 'minus'}">${t.type === 'income' ? '+' : '-'}${fmtMoney(t.amount)}</div>
        </div>`).join('')}
    </div>
    ${bottomNav('wallet')}`;
  }, () => {});

  /* ================================================================
     PROFILE — профиль пользователя
  ================================================================ */
  register('profile', () => {
    const u = Store.getUser();
    const stats = Store.computeStats();
    const myAssignments = Store.getAssignments().filter(a => a.userId === u.id);
    const workerR = Store.getUserRating('worker');
    const employerR = Store.getUserRating('employer');

    return `
    ${topbar('👤 Профиль')}
    <div class="page">
      <div class="profile-head">
        <div class="avatar">${(u.name && u.name[0]) || 'Г'}</div>
        <div>
          <div style="font-size:18px;font-weight:700">${esc(u.name)}</div>
          <div style="font-size:13px;color:var(--text-2)">${u.role === 'employer' ? 'Работодатель' : u.role === 'both' ? 'Исполнитель / Работодатель' : 'Исполнитель'}${isAdmin() ? ' · ⚙️ Админ' : ''}</div>
        </div>
      </div>

      <div class="stats" style="margin-bottom:14px">
        <div class="stat-card blue">
          <div class="val" style="font-size:20px">⭐ ${workerR.count ? workerR.score.toFixed(1) : '—'}</div>
          <div class="label">Рейтинг исполнителя (${workerR.count} оценок)</div>
        </div>
        <div class="stat-card green">
          <div class="val" style="font-size:20px">⭐ ${employerR.count ? employerR.score.toFixed(1) : '—'}</div>
          <div class="label">Рейтинг работодателя (${employerR.count} оценок)</div>
        </div>
      </div>

      <div style="padding:0 16px">
        <button class="btn btn--block btn--ghost btn--sm" data-action="edit-name" style="margin-bottom:14px">✏️ Редактировать имя</button>
      </div>

      <div class="stats" style="margin-bottom:18px">
        ${statCard(myAssignments.length, 'Взято заданий', 'blue')}
        ${statCard(myAssignments.filter(a => a.status === 'done').length, 'Выполнено', 'green')}
        ${statCard(fmtMoney(Store.getBalance()), 'Баланс', 'amber')}
        ${statCard(myAssignments.filter(a => a.status === 'pending').length, 'На проверке', 'accent')}
      </div>

      <div class="section-title">Мои задания</div>
      ${myAssignments.length === 0 ? '<div class="empty"><div class="e-ico">📭</div><div class="e-title">У вас нет взятых заданий</div></div>' :
        myAssignments.map(a => {
          const t = Store.getTask(a.taskId);
          return '<div class="my-task" data-action="open-my-task" data-aid="' + a.id + '">' +
            '<div class="mt-body"><div class="mt-title">' + esc(t ? t.title : 'Задание') + '</div>' +
            '<div class="mt-sub">' + statusHTML(a.status) + '</div></div>' +
            '<div style="font-weight:800;color:var(--text-2)">→</div></div>';
        }).join('')}

      ${isAdmin() ? '<button class="btn btn--block btn--ghost btn--sm" data-action="admin-panel" style="margin-top:16px">⚙️ Админ-панель</button>' : ''}
      <button class="btn btn--block btn--red btn--sm" data-action="reset-data" style="margin-top:12px">🔄 Сбросить демо-данные</button>
    </div>
    ${bottomNav('profile')}`;
  }, () => {});

  /* ================================================================
     ADMIN — админ-панель
  ================================================================ */
  register('admin', () => {
    const stats = Store.computeStats();
    return `
    ${topbar('⚙️ Админ-панель')}
    <div class="page">
      <div class="section-title">Управление платформой</div>
      <div class="card" style="text-align:center;margin-bottom:16px">
        <div style="font-size:13px;color:var(--text-2)">Статистика</div>
        <div style="display:flex;justify-content:space-around;margin-top:10px">
          <div><div style="font-weight:800;font-size:18px">${stats.activeTasks}</div><div style="font-size:12px;color:var(--text-3)">Активных</div></div>
          <div><div style="font-weight:800;font-size:18px">${stats.doneTasks}</div><div style="font-size:12px;color:var(--text-3)">Выполнено</div></div>
          <div><div style="font-weight:800;font-size:18px">${fmtMoney(stats.earned)}</div><div style="font-size:12px;color:var(--text-3)">Заработано</div></div>
          <div><div style="font-weight:800;font-size:18px">${stats.employers}</div><div style="font-size:12px;color:var(--text-3)">Работодателей</div></div>
        </div>
      </div>

      <div class="section-title">Тарифы (быстрая правка)</div>
      ${SUBSCRIPTIONS.map(p => `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div><div style="font-weight:600">${p.name}</div><div style="font-size:13px;color:var(--text-3)">${p.days} дн</div></div>
        <input type="number" class="admin-price" data-plan="${p.id}" value="${p.price}" style="width:80px;padding:8px;background:var(--card-solid);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;text-align:center">
        <small style="color:var(--text-3)">₽</small>
      </div>`).join('')}
      <button class="btn btn--block btn--sm" data-action="save-prices" style="margin-bottom:18px">💾 Сохранить цены</button>

      <button class="btn btn--block btn--ghost btn--sm" data-action="navigate" data-page="subs">📢 Просмотр тарифов</button>
      <button class="btn btn--block btn--red btn--sm" data-action="reset-data" style="margin-top:12px">🔄 Сбросить демо-данные</button>
    </div>`;
  }, () => {});

  /* ================================================================
     ГЛОБАЛЬНАЯ ПРИВЯЗКА СОБЫТИЙ
  ================================================================ */
  window.addEventListener('click', function (e) {
    let el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (!action) return;

    switch (action) {
      case 'back':
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
      case 'rate-employer': {
        const aid = Number(el.dataset.aid);
        const stars = Number(el.dataset.stars);
        const a = Store.getAssignment(aid);
        if (!a || a.rated) { toast('Уже оценено'); return; }
        a.rated = true;
        a.rating = stars;
        Store.addRating('employer', stars);
        Store.save();
        toast('⭐ Спасибо! Оценка ' + stars + '/5');
        vibrate();
        navigate('my-task-detail', { aid: aid });
        break;
      }
      case 'filter-sort': {
        const f = TaskPay.filters();
        f.sort = el.dataset.sort;
        navigate('tasks');
        break;
      }
      case 'take-task': {
        const taskId = Number(el.dataset.id);
        const t = Store.getTask(taskId);
        if (!t) return;
        if (t.spotsLeft <= 0) { toast('Места закончились!', true); return; }
        const u = Store.getUser();
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
        toast('Задание взято! Подробности в Профиле → Мои задания');
        vibrate();
        navigate('my-task-detail', { aid: a.id });
        break;
      }
      case 'select-proof': {
        const parent = el.closest('.opt-row');
        if (parent) {
          parent.querySelectorAll('[data-proof]').forEach(x => x.classList.remove('active'));
          el.classList.add('active');
        }
        const aid = el.dataset.aid;
        if (aid) {
          const a = Store.getAssignment(Number(aid));
          if (a) a.proofType = el.dataset.proof;
        }
        break;
      }
      case 'submit-proof': {
        const aid = Number(el.dataset.aid);
        const a = Store.getAssignment(aid);
        if (!a) return;
        const text = $('proof-text') ? $('proof-text').value : '';
        const comment = $('proof-comment') ? $('proof-comment').value : '';
        const activeProof = el.closest('.card').querySelector('[data-proof].active');
        if (!activeProof && !text) {
          toast('Выберите тип подтверждения', true);
          return;
        }
        a.status = 'pending';
        a.proofType = activeProof ? activeProof.dataset.proof : 'text';
        a.proofData = text || comment || 'отправлено';
        Store.save();
        toast('📤 Отправлено на проверку!');
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

        if (!title.value.trim() || !desc.value.trim() || !instruction.value.trim()) {
          toast('Заполните все обязательные поля', true);
          vibrate('heavy');
          return;
        }
        const s = parseInt(spots.value) || 0;
        const r = parseInt(reward.value) || 0;
        if (s < 1 || r < 1) {
          toast('Некорректное количество или оплата', true);
          return;
        }

        const selectedProofs = [];
        document.querySelectorAll('[data-proof].active').forEach(el => selectedProofs.push(el.dataset.proof));
        if (selectedProofs.length === 0) {
          toast('Выберите тип подтверждения', true);
          return;
        }

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

        const published = Store.addTask(task);
        Store.data.employersCount += 1;
        Store.save();
        toast('✅ Задание опубликовано! Бюджет ' + fmtMoney(totalBudget));
        vibrate();
        navigate('tasks');
        break;
      }
      case 'buy-sub': {
        const planId = el.dataset.plan;
        const plan = SUBSCRIPTIONS.find(p => p.id === planId);
        if (!plan) return;
        const bal = Store.getBalance();
        if (bal < plan.price) {
          toast('Недостаточно средств на балансе', true);
          navigate('wallet');
          return;
        }
        tgConfirm('Подписка', 'Оплатить ' + fmtMoney(plan.price) + ' за тариф «' + plan.name + '»?').then(ok => {
          if (!ok) return;
          const res = Store.activateSubscription(planId);
          if (!res.ok) { toast(res.error, true); return; }
          toast('✅ Подписка «' + plan.name + '» активирована!');
          vibrate();
          navigate('subs');
        });
        break;
      }
      case 'pay-out': {
        const bal = Store.getBalance();
        if (bal < 10) { toast('Минимум 10 ₽ для вывода', true); return; }
        tgPopup('Вывод средств', 'В полной версии здесь будет интеграция с платёжной системой (ЮMoney, СБП и др.). Сейчас баланс: ' + fmtMoney(bal));
        break;
      }
      case 'edit-name': {
        const u = Store.getUser();
        tgPopup('Имя', 'Ваше имя: ' + u.name + '\n\nВ полной версии здесь будет форма редактирования.');
        break;
      }
      case 'admin-panel': {
        navigate('admin');
        break;
      }
      case 'save-prices': {
        const inputs = document.querySelectorAll('.admin-price');
        inputs.forEach(inp => {
          const plan = SUBSCRIPTIONS.find(p => p.id === inp.dataset.plan);
          if (plan) plan.price = parseInt(inp.value) || plan.price;
        });
        toast('✅ Цены сохранены!');
        vibrate();
        break;
      }
      case 'reset-data': {
        tgConfirm('Сброс', 'Все демо-данные будут перезаписаны. Продолжить?').then(ok => {
          if (!ok) return;
          Store.reset();
          navigate('home');
          toast('🔄 Данные сброшены');
        });
        break;
      }
      case 'refresh-wallet': {
        navigate('wallet');
        break;
      }
    }
  });

  /* ---------- Экспорт ---------- */
  window.TaskPayScreens = { init: function () {} };
})();