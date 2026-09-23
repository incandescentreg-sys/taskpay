// ============================================================
// Yumitask — edge function: отправка уведомлений в Telegram
// Серверно шлёт сообщения от имени бота (BOT_TOKEN — секрет).
// Токен НЕ должен попадать в клиент.
//
// POST { chat_id, text }  или  { messages: [{ chat_id, text }] }
// Работает без JWT (--no-verify-jwt), т.к. вызывается из клиента.
// ============================================================

const BOT_TOKEN = Deno.env.get('BOT_TOKEN') || '';

async function sendMessage(msg) {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN not set' };
  if (!msg || !msg.chat_id || !msg.text) return { ok: false, error: 'bad payload' };
  try {
    const res = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(msg.chat_id),
        text: String(msg.text).slice(0, 4000),
        parse_mode: msg.parse_mode || 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    return { ok: !!data.ok, error: data.description || null, res: data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const body = await req.json();
    const list = Array.isArray(body) ? body : (body.messages || [body]);
    const results = [];
    for (const m of list) {
      results.push(await sendMessage(m));
    }
    return Response.json({ ok: true, results }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});