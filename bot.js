/* ============================================================
   Yumitask — Telegram-бот (Node.js, без внешних зависимостей).
   /start → баннер: ID, ник, баланс + кнопки «Пополнить баланс»,
   «Профиль» и «Открыть Yumitask».

   Настройка:
   1. Создайте бота у @BotFather, получите токен.
   2. Создайте Mini App (кнопка Menu Button / веб-приложение),
      укажите URL вашего хостинга (HTTPS обязателен).
   3. Задайте токен:  set BOT_TOKEN=ваш_токен   (Windows cmd)
      или экспортируйте переменную BOT_TOKEN.
   4. (Необязательно, для реального баланса/ID) задайте:
      set SUPABASE_URL=https://xxxx.supabase.co
      set SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
   5. Запуск:  node bot.js
   ============================================================ */
'use strict';

const https = require('https');
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://ваш-домен.example/app'; // замените на реальный URL
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!BOT_TOKEN) {
  console.error('Ошибка: задайте переменную окружения BOT_TOKEN (например: set BOT_TOKEN=123456:ABC...)');
  process.exit(1);
}

const API = 'api.telegram.org';

function apiCall(method, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const req = https.request({
      hostname: API,
      path: '/bot' + BOT_TOKEN + '/' + method,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/* Получение пользователя из Supabase по Telegram id */
function supabaseGet(tgId) {
  return new Promise((resolve) => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return resolve(null);
    const host = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const path = '/rest/v1/users?id=eq.' + encodeURIComponent(tgId) +
                 '&select=id,name,uid,balance,is_blocked';
    const req = https.request({
      hostname: host,
      path: path,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const arr = JSON.parse(data);
          resolve(Array.isArray(arr) && arr.length ? arr[0] : null);
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU') + ' ₽';
}

function profileText(u) {
  return '👤 Профиль Yumitask\n\n' +
         '🆔 ID: <b>' + u.id + '</b>\n' +
         '🎯 Уникальный UID: <b>' + (u.uid || '—') + '</b>\n' +
         '👤 Ник: <b>' + (u.name || 'Гость') + '</b>\n' +
         '💰 Баланс: <b>' + fmt(u.balance) + '</b>\n\n' +
         'Полный профиль, задания и статистика — в мини-приложении.' +
         (u.is_blocked ? '\n\n⚠️ Аккаунт заблокирован. Свяжитесь с поддержкой.' : '');
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💳 Пополнить баланс', callback_data: 'replenish' },
        { text: '👤 Профиль', callback_data: 'profile' }
      ],
      [{ text: '🚀 Открыть Yumitask', web_app: { url: MINI_APP_URL } }]
    ]
  };
}

async function sendBanner(chatId, tgUser) {
  const u = await supabaseGet(tgUser.id);
  const id = tgUser ? tgUser.id : '';
  const nick = tgUser ? ([tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')) : '';
  let banner;
  if (u) {
    banner = '👋 Добро пожаловать в <b>Yumitask</b>!\n\n' +
             '🆔 ID: <b>' + u.id + '</b>\n' +
             '👤 Ник: <b>' + (u.name || nick || 'Гость') + '</b>\n' +
             '💰 Баланс: <b>' + fmt(u.balance) + '</b>\n\n' +
             'Выполняй задания, получай деньги, размещай задания — проверяй исполнителей. Всё в одном приложении!';
  } else {
    banner = '👋 Добро пожаловать в <b>Yumitask</b>!\n\n' +
             '🆔 ID: <b>' + id + '</b>\n' +
             '👤 Ник: <b>' + (nick || 'Гость') + '</b>\n\n' +
             'Выполняй задания, получай деньги, размещай задания — проверяй исполнителей. Всё в одном приложении!';
  }
  await apiCall('sendMessage', {
    chat_id: chatId,
    text: banner,
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard()
  });
}

async function handleUpdate(update) {
  const msg = update.message || update.callback_query && update.callback_query.message;
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;

  if (update.callback_query) {
    const cq = update.callback_query;
    const data = cq.data || '';
    if (data === 'open_app') {
      await apiCall('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: 'Открываю Yumitask…',
        url: MINI_APP_URL
      });
      return;
    }
    if (data === 'replenish' || data === 'ppbtn') {
      await apiCall('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: '💳 Пополнение скоро будет доступно. Пока откройте мини-приложение!',
        show_alert: false
      });
      return;
    }
    if (data === 'profile') {
      const u = await supabaseGet(msg.chat.type === 'private' ? update.callback_query.from.id : chatId);
      const from = update.callback_query.from || {};
      const eff = u || { id: from.id, name: [from.first_name, from.last_name].filter(Boolean).join(' '), uid: '—', balance: 0 };
      await apiCall('sendMessage', {
        chat_id: chatId,
        text: profileText(eff),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Открыть Yumitask', web_app: { url: MINI_APP_URL } }]
          ]
        }
      });
      await apiCall('answerCallbackQuery', { callback_query_id: cq.id });
      return;
    }
    if (data === 'start_menu') {
      await sendBanner(chatId, update.callback_query.from || {});
      await apiCall('answerCallbackQuery', { callback_query_id: cq.id });
      return;
    }
  }

  const text = (msg.text || '').trim();
  if (text === '/start') {
    await sendBanner(chatId, msg.from || {});
    return;
  }

  await apiCall('sendMessage', {
    chat_id: chatId,
    text: 'Используйте кнопки ниже или команду /start.',
    reply_markup: mainMenuKeyboard()
  });
}

const server = require('http').createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405); return res.end();
  }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const update = JSON.parse(body);
      await handleUpdate(update);
      res.writeHead(200); res.end('ok');
    } catch (e) {
      console.error('Ошибка обработки:', e.message);
      res.writeHead(200); res.end('ok');
    }
  });
});

const PORT = process.env.PORT_WEBHOOK || 8443;
server.listen(PORT, () => console.log('Бот слушает webhook на порту ' + PORT));