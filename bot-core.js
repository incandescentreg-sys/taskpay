/* ============================================================
   Yumitask — общая логика Telegram-бота (webhook).
   Юзер-модуль для запуска и на Vercel (api/webhook.js),
   и локально (bot.js).
   ============================================================ */
'use strict';

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const MINI_APP_URL = process.env.MINI_APP_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !tgId) return resolve(null);
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
         '🆔 ID: <b>' + (u.id || '—') + '</b>\n' +
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
  const me = tgUser || {};
  const u = await supabaseGet(me.id);
  const id = u ? u.id : (me.id || '');
  const nick = u ? (u.name || 'Гость')
                 : ([me.first_name, me.last_name].filter(Boolean).join(' ') || 'Гость');
  const bal = u ? '\n💰 Баланс: <b>' + fmt(u.balance) + '</b>' : '';
  const caption = '👋 Добро пожаловать в <b>Yumitask</b>!\n\n' +
                 '🆔 ID: <b>' + id + '</b>\n' +
                 '👤 Ник: <b>' + nick + '</b>' + bal + '\n\n' +
                 'Выполняй задания, получай деньги, размещай задания — проверяй исполнителей. Всё в одном приложении!';

  const bannerUrl = (MINI_APP_URL.replace(/\/$/, '')) + '/banner.jpg';

  /* отправляем фото с подписью + кнопками */
  try {
    const sent = await apiCall('sendPhoto', {
      chat_id: chatId,
      photo: bannerUrl,
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard()
    });
    if (sent && sent.ok) return;
  } catch (e) {
    console.error('sendPhoto error', e.message);
  }

  /* если фото не ушло — запасной вариант текстом */
  await apiCall('sendMessage', {
    chat_id: chatId,
    text: caption,
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard()
  });
}

async function handleUpdate(update) {
  if (!BOT_TOKEN || !MINI_APP_URL) return;
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
    if (data === 'replenish') {
      await apiCall('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: '💳 Пополнение скоро будет доступно. Пока откройте мини-приложение!'
      });
      return;
    }
    if (data === 'profile') {
      const from = cq.from || {};
      const u = await supabaseGet(from.id);
      const eff = u || { id: from.id || '—', name: [from.first_name, from.last_name].filter(Boolean).join(' '), uid: '—', balance: 0 };
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

module.exports = { apiCall, sendBanner, handleUpdate, BOT_TOKEN, MINI_APP_URL, SUPABASE_URL };