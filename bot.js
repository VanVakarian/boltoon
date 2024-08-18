import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { initDatabase } from './db/init.js';
import { getUser, getAdminUsers } from './db/users.js';

import { TG_BOT_TOKEN } from './env.js';
import { MODELS, DEFAULT_MODEL_KEY } from './const.js';
import { escapeHTML } from './utils.js';

import { handleChooseModel, handleSetTimezone, handleModelSelection, handleTimezoneSelection } from './bot/settings.js';

import { generateResponse } from './bot/gpt.js';

await initDatabase();

const bot = new Telegraf(TG_BOT_TOKEN);

bot.command('start', (ctx) => {
  ctx.reply('Добро пожаловать! Используйте /choosemodel для настройки модели и /settz для установки часового пояса.');
});

bot.command('choosemodel', handleChooseModel);
bot.command('settz', handleSetTimezone);
bot.action(/^select_model:(.+)$/, handleModelSelection);
bot.action(/^set_tz:(-?\d+)$/, handleTimezoneSelection);

bot.on(message('text'), async (ctx) => {
  const tgId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const user = await getUser(tgId);
  let selectedModelKey = user?.selected_model_key;

  if (!selectedModelKey || !MODELS[selectedModelKey]) selectedModelKey = DEFAULT_MODEL_KEY;

  if (!user.is_activated) return;

  try {
    await ctx.sendChatAction('typing');
    const quote = ctx.message.reply_to_message?.text;
    const fullMessage = quote ? `${quote}\n\n${userMessage}` : userMessage;

    const { answer, totalCost } = await generateResponse(selectedModelKey, fullMessage);

    const reply = `${answer}\n\nСтоимость этого запроса: $${totalCost}`;
    await ctx.reply(reply);
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply(`Произошла ошибка:\n${error}.\nОтчёт уже отправлен Владу.`);
    await sendErrorToAdmin(error);
  }
});

async function sendErrorToAdmin(error) {
  const adminUsers = await getAdminUsers();
  const errorMessage = `❗️Ошибка в боте:\n\n<pre><code>${escapeHTML(String(error.stack))}</code></pre>`;

  for (const admin of adminUsers) {
    try {
      await bot.telegram.sendMessage(admin.tg_id, errorMessage, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error(`Не удалось отправить сообщение об ошибке админу ${admin.tg_id}:`, sendError);
    }
  }
}

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
