// ============================================================
// Yumitask — edge function: отправка уведомлений в Telegram
// Серверно шлёт сообщения от имени бота (BOT_TOKEN — секрет).
// Токен НЕ должен попадать в клиент.
//
// POST { chat_id, text }  или  { messages: [{ chat_id, text }] }
//      опционально photo: data-url (тогда шлём sendPhoto)
// Работает без JWT (--no-verify-jwt) и с CORS-заголовками,
// т.к. вызывается из браузера (Preflight OPTIONS).
// ============================================================

const BOT_TOKEN = Deno.env.get('BOT_TOKEN') || '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function sendMessage(msg) {
  if (!BOT_TOKEN) return Promise.resolve({ ok: false, error: 'BOT_TOKEN not set' });
  if (!msg || !msg.chat_id || !msg.text) return Promise.resolve({ ok: false, error: 'bad payload' });
  return fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: Number(msg.chat_id),
      text: String(msg.text).slice(0, 4000),
      parse_mode: msg.parse_mode || 'HTML',
      disable_web_page_preview: true
    })
  }).then(async function (res) {
    const data = await res.json();
    return { ok: !!data.ok, error: data.description || null, res: data };
  }).catch(function (e) {
    return { ok: false, error: e.message };
  });
}

/* Отправка фотографии: декодируем data-url → бинарник → multipart */
function sendPhoto(msg) {
  if (!BOT_TOKEN || !msg || !msg.chat_id || !msg.photo) {
    return Promise.resolve({ ok: false, error: 'bad photo payload' });
  }
  try {
    const m = /^data:([^;]+);base64,(.+)$/.exec(String(msg.photo).trim());
    if (!m) return Promise.resolve({ ok: false, error: 'not a data url' });
    const mime = m[1];
    const bytes = atob(m[2]);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const form = new FormData();
    form.append('chat_id', String(msg.chat_id));
    form.append('photo', blob, 'image.jpg');
    form.append('caption', String(msg.text || '').slice(0, 1000));
    form.append('parse_mode', msg.parse_mode || 'HTML');
    return fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendPhoto', {
      method: 'POST',
      body: form
    }).then(async function (res) {
      const data = await res.json();
      return { ok: !!data.ok, error: data.description || null, res: data };
    }).catch(function (e) {
      return { ok: false, error: e.message };
    });
  } catch (e) {
    return Promise.resolve({ ok: false, error: e.message });
  }
}

async function routeMsg(m) {
  if (m && m.photo) return await sendPhoto(m);
  return await sendMessage(m);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }
  try {
    const body = await req.json();
    const list = Array.isArray(body) ? body : (body.messages || [body]);
    const results = [];
    for (const m of list) {
      results.push(await routeMsg(m));
    }
    return Response.json({ ok: true, results }, { status: 200, headers: CORS });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
});