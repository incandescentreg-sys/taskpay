/* Проверка подключения к Supabase: читаем таблицы, пробуем записать */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const URL = 'https://olwyzvyprcfypbpetgvf.supabase.co';
const KEY = 'sb_publishable_r1Ltg3tpWgem_D5Myyillg_59mbUGGr';

const sb = createClient(URL, KEY);

// 1. Читаем задачи
const { data: tasks, error: errTasks } = await sb.from('tasks').select('*').limit(5);
console.log('TASKS:', errTasks ? 'ERR ' + errTasks.message : tasks);

// 2. Читаем пользователей
const { data: users, error: errUsers } = await sb.from('users').select('id, name, balance').limit(5);
console.log('USERS:', errUsers ? 'ERR ' + errUsers.message : users);

// 3. Читаем чаты
const { data: chats, error: errChats } = await sb.from('chats').select('*').limit(5);
console.log('CHATS:', errChats ? 'ERR ' + errChats.message : chats);

// 4. Пробуем вставить тестового юзера (если нет RLS запрета)
const { data: ins, error: errIns } = await sb.from('users').insert({
  id: 999999999,
  name: 'CLI тест',
  balance: 0
}).select().single();
console.log('INSERT:', errIns ? 'ERR ' + errIns.message : 'OK id=' + ins.id);