import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { BOT_TOKEN } from './env.js';

const bot = new Telegraf(BOT_TOKEN);

const userSettings = new Map();

const models = ['GPT-3.5', 'GPT-4', 'DALL-E', 'Stable Diffusion'];

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

bot.on(message('text'), (ctx) => {
  const userId = ctx.from.id.toString();
  const currentModel = userSettings.get(userId) || 'Не выбрана';
  ctx.reply(`Вы сказали: ${ctx.message.text}\nТекущая модель: ${currentModel}`);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
