import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import OpenAI from 'openai';

import { TG_BOT_TOKEN, OPENAI_TOKEN } from './env.js';

const bot = new Telegraf(TG_BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_TOKEN });

const userSettings = new Map();
const defaultModel = 'gpt-4o-mini';
const models = ['gpt-4o', 'gpt-4o-mini'];

function getModelKeyboard() {
  return Markup.inlineKeyboard(models.map((model) => [Markup.button.callback(model, `select_model:${model}`)]));
}

bot.command('start', (ctx) => {
  ctx.reply('Добро пожаловать! Используйте /choosemodel для настройки модели.');
});

bot.command('choosemodel', (ctx) => {
  ctx.reply('Выберите модель:', getModelKeyboard());
});

bot.action(/^select_model:(.+)$/, (ctx) => {
  const model = ctx.match[1];
  const userId = ctx.from.id.toString();

  userSettings.set(userId, model);
  console.log('Updated userSettings:', userSettings);

  ctx.answerCbQuery(`Вы выбрали модель: ${model}`);
  ctx.editMessageText(`Текущая модель: ${model}`, getModelKeyboard());
});

bot.on(message('text'), async (ctx) => {
  const userId = ctx.from.id.toString();
  const currentModel = userSettings.get(userId) || defaultModel;

  try {
    await ctx.sendChatAction('typing');

    const request = ctx.message.text;
    console.log('User request:', request);
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: request },
      ],
      model: currentModel,
    });

    const answer = completion.choices[0].message.content;
    console.log('OpenAI response:', answer);
    const reply = answer;
    await ctx.reply(reply);
  } catch (error) {
    console.error('Error with OpenAI:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего запроса.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
