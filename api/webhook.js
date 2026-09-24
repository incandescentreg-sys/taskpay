/* ============================================================
   Yumitask — Telegram webhook (Vercel Serverless Function).
   Точка входа для Vercel: POST https://ваш-домен.vercel.app/api/webhook
   Логика бота — в bot-core.js (общая с локальным bot.js).
   ============================================================ */
'use strict';

const { handleUpdate } = require('../bot-core');

module.exports = async function webhook(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, msg: 'Yumitask webhook ready' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let body = '';
  try {
    for await (const chunk of req) body += chunk;
    const update = JSON.parse(body || '{}');
    /* ждём завершения, иначе Vercel завершит функцию до отправки сообщения */
    await handleUpdate(update);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error', e.message);
    res.status(200).json({ ok: false, error: e.message });
  }
};