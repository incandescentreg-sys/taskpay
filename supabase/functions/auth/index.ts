// ============================================================
// Yumitask — edge function: верификация Telegram initData
// и выдача self-contained JWT для доступа к БД.
//
// Запуск:  supabase functions new auth
// Переменные (настройка в Supabase → Edge Functions → Secrets):
//   BOT_TOKEN — токен вашего Telegram-бота (от @BotFather)
//   JWT_SECRET — любая длинная строка (генератор: openssl rand -hex 32)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('BOT_TOKEN') || '';
const JWT_SECRET = Deno.env.get('JWT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// ---------- Верификация подписи initData (Telegram) ----------
async function verifyInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const items = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const enc = new TextEncoder();
  const botKey = await crypto.subtle.importKey(
    'raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const secret = await crypto.subtle.sign('HMAC', botKey, enc.encode(BOT_TOKEN));
  const secretKey = await crypto.subtle.importKey(
    'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const computed = await crypto.subtle.sign('HMAC', secretKey, enc.encode(items));
  const hex = [...new Uint8Array(computed)].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex !== hash) return null;

  const userRaw = params.get('user');
  return userRaw ? JSON.parse(userRaw) : null;
}

// ---------- Своя подпись JWT (без зависимости от Supabase Auth) ----------
function b64url(obj) {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(payload) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${b64url(header)}.${b64url(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sigB64}`;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { initData } = await req.json();
    const tgUser = await verifyInitData(initData || '');
    if (!tgUser) {
      return Response.json({ error: 'Bad initData' }, { status: 401 });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // создаём/обновляем пользователя
    const { data: user, error: upsertErr } = await sb.from('users').upsert(
      {
        id: Number(tgUser.id),
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Гость',
        photo_url: tgUser.photo_url || null
      },
      { onConflict: 'id' }
    ).select().single();
    if (upsertErr) {
      return Response.json({ error: 'DB upsert failed: ' + upsertErr.message }, { status: 500 });
    }

    // JWT с "id" пользователя — наш собственный формат
    const token = await signJwt({
      iss: 'yumitask',
      id: Number(tgUser.id),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 дней
    });

    return Response.json({ token, user }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}