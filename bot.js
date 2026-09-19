/* ============================================================
   Yumitask — Telegram-бот (Node.js, без внешних зависимостей).
   Обрабатывает команду /start и открывает Mini App.

   Настройка:
   1. Создайте бота у @BotFather, получите токен.
   2. Создайте Mini App (кнопка Menu Button / веб-приложение),
      укажите URL вашего хостинга (HTTPS обязателен).
   3. Задайте токен:  set BOT_TOKEN=ваш_токен   (Windows cmd)
      или экспортируйте переменную BOT_TOKEN.
   4. Запуск:  node bot.js
   ============================================================ */
'use strict';

const https = require('https');
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://ваш-домен.example/app'; // замените на реальный URL

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

async function handleUpdate(update) {
  const msg = update.message || update.callback_query && update.callback_query.message;
  if (!msg || !msg.chat) return;

  const chatId = msg.chat.id;

  if (update.callback_query) {
    const data = update.callback_query.data || '';
    if (data === 'open_app') {
      await apiCall('answerCallbackQuery', {
        callback_query_id: update.callback_query.id,
        text: 'Открываю Yumitask…',
        url: MINI_APP_URL
      });
      return;
    }
  }

  const text = (msg.text || '').trim();
  if (text === '/start') {
    await apiCall('sendMessage', {
      chat_id: chatId,
      text: '👋 Привет! Это Yumitask — биржа заданий.\n\n' +
            '💼 Размещайте задания — находите исполнителей\n' +
            '🔍 Выполняйте задания — получайте деньги\n\n' +
            'Нажмите кнопку ниже, чтобы открыть приложение:',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть Yumitask', web_app: { url: MINI_APP_URL } }]
        ]
      }
    });
    return;
  }

  await apiCall('sendMessage', {
    chat_id: chatId,
    text: 'Используйте кнопку «🚀 Открыть Yumitask», чтобы запустить приложение.',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть Yumitask', web_app: { url: MINI_APP_URL } }]
      ]
    }
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