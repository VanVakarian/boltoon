import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';

import { initDatabase } from './db/init.js';
import { getUser, createUser, updateUserModel, getAdminUsers } from './db/users.js';

import { getChatGPTResponse } from './gpt/chatgpt.js';
import { getClaudeResponse } from './gpt/claude.js';

import { TG_BOT_TOKEN } from './env.js';
import { MODELS, MODEL_LIST } from './const.js';
import { escapeHTML } from './utils.js';

await initDatabase();

const bot = new Telegraf(TG_BOT_TOKEN);

function getModelKeyboard() {
  return Markup.inlineKeyboard(
    MODEL_LIST.map((modelKey) => [Markup.button.callback(MODELS[modelKey].buttonText, `select_model:${modelKey}`)])
  );
}

bot.command('start', (ctx) => {
  ctx.reply('Добро пожаловать! Используйте /choosemodel для настройки модели.');
});

bot.command('choosemodel', (ctx) => {
  ctx.reply('Выберите модель:', getModelKeyboard());
});

bot.action(/^select_model:(.+)$/, async (ctx) => {
  const modelKey = ctx.match[1];
  const tgId = ctx.from.id.toString();
  const success = await updateUserModel(tgId, modelKey);
  if (success) {
    await ctx.answerCbQuery(`Вы выбрали модель: ${MODELS[modelKey].shortName}`);
    await ctx.editMessageText(`Текущая модель: ${MODELS[modelKey].buttonText}`);
  } else {
    await ctx.answerCbQuery('Произошла ошибка при обновлении модели');
  }
});

bot.on(message('text'), async (ctx) => {
  const tgId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const user = await getUser(tgId);
  const selectedModel = user.selected_model;

  if (!user.is_activated) return;

  try {
    await ctx.sendChatAction('typing');
    const quote = ctx.message.reply_to_message?.text;
    const fullMessage = quote ? `${quote}\n\n${userMessage}` : userMessage;

    let response;
    if (selectedModel.startsWith('gpt')) {
      response = await getChatGPTResponse(selectedModel, fullMessage);
    } else if (selectedModel.startsWith('claude')) {
      response = await getClaudeResponse(selectedModel, fullMessage);
    } else {
      throw new Error('Unsupported model');
    }

    // console.log('\nCompletion:', response);

    const { answer, inputTokens, outputTokens } = response;
    const inputCost = (inputTokens * MODELS[selectedModel].prices.input) / 1000;
    const outputCost = (outputTokens * MODELS[selectedModel].prices.output) / 1000;
    const totalCost = inputCost + outputCost;

    // console.log(`Стоимость запроса: $${totalCost.toFixed(4)}`);

    const reply = `${answer}\n\nСтоимость этого запроса: $${totalCost.toFixed(4)}`;
    await ctx.reply(reply);
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply(`Произошла ошибка: ${error}, отчёт уже отправлен Владу.`);
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
