# Настройка бэкенда Supabase для Yumitask

## 1. Создайте проект Supabase

1. Зайдите на [supabase.com](https://supabase.com) → **New project** → укажите имя (например `yumitask`) и **Database Password** (сохраните его).
2. Дождитесь создания (1–2 минуты), перейдите в проект.

## 2. Выполните схему БД

1. В проекте Supabase откройте **SQL Editor** → **New query**.
2. Скопируйте всё содержимое файла `supabase/schema.sql` из этого репозитория.
3. Вставьте в редактор и нажмите **Run**.
4. Проверьте: в **Table Editor** должны появиться таблицы `users`, `tasks`, `assignments`, `transactions`, `chats`, `messages`.

## 3. Получите ключи

1. В Supabase → **Settings** (шестерёнка внизу слева) → **API**.
2. Скопируйте:
   - **Project URL** (например `https://abcdefgh.supabase.co`)
   - **anon / public** key (`eyJ...` или `sb_publishable_...`)

## 4. Вставьте ключи в проект

Откройте **`js/api.js`** и замените две строки вверху:

```js
var SUPABASE_URL = 'https://ВАШ-ПРОЕКТ.supabase.co';   // ваш Project URL
var SUPABASE_ANON_KEY = 'eyJ...ваш_anon_ключ';         // ваш anon key (или sb_publishable_...)
```

## 5. Включите Realtime (для чата и живых заданий)

1. Supabase → **Database** → **Replication** (или **Realtime**).
2. В блоке **Supabase Replication** включите переключатель для `messages` и `tasks`.
3. В подразделе **Sources**: `messages` → **INSERT**; `tasks` → **INSERT**.

Альтернатива (если раздел пуст) — выполнить в SQL Editor:

```sql
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tasks;
```

## 6. MVP-политики доступа

Выполните в SQL Editor файл **`supabase/policies-mvp.sql`** — он заменяет строгие RLS-политики на рабочие для прототипа (анонимный клиент может читать/писать).

> Это ослабленные правила для теста. Перед публичным запуском верните строгие политики и включите авторизацию (п. 8).

## 7. Функции баланса и вывод средств

Выполните в SQL Editor файл **`supabase/functions.sql`** — создаёт:
- `change_balance()` — атомарное изменение баланса + транзакция;
- `request_payout()` — создание заявки на вывод;
- таблицу `payouts`.

## 8. Edge-функции (авторизация и подтверждение заданий) — РЕКОМЕНДУЕТСЯ

Нужны для безопасного входа (проверка подписи Telegram initData) и честных выплат (только работодатель подтверждает, деньги начисляются автоматически).

### Установите Supabase CLI (один раз)

```
npm install -g supabase
supabase login
```

### Локальная папка функций

В корне проекта уже лежат:
- `supabase/functions/auth/index.ts` — вход по initData → выдаёт JWT
- `supabase/functions/complete-assignment/index.ts` — подтверждение выполнения + начисление

### Локальный запуск (для разработки)

```
supabase start
supabase functions serve --env-file ./supabase/.env.local
```

### Деплой функций

```
supabase functions deploy auth
supabase functions deploy complete-assignment
```

### Секреты (обязательно перед деплоем функций)

```
supabase secrets set BOT_TOKEN=<токен бота от @BotFather>
supabase secrets set JWT_SECRET=<случайная длинная строка>
```

`JWT_SECRET` можно сгенерировать: `openssl rand -hex 32`.

> `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` подставляются автоматически — их задавать не нужно.

### Что делают функции

- **`auth`**: проверяет подпись `initData` секретом бота, создаёт/обновляет пользователя в таблице `users`, возвращает JWT.
- **`complete-assignment`**: проверяет, что вызывает работодатель задания, подтверждает отклик `pending → done`, списывает награду с работодателя и зачисляет исполнителю через `change_balance`.

## 9. Обновление версии приложения

После изменения `index.html`/`js` не забывайте поднимать версию ассетов (`?v=N`) и пушить в **ветку `main`** (production на Vercel собирается из неё):

```
git push origin master
git push origin master:main --force
```

## Как это работает в приложении

- Если в `js/api.js` подставлены ключи — приложение работает через **Supabase API** (синхронизация).
- Если ключи не подставлены — приложение работает как раньше, на **localStorage** (демо-режим).
- С включёнными edge-функциями: вход по initData, честный баланс в БД, подтверждение заданий с автопереводом средств, заявки на вывод.