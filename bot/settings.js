import { Markup } from 'telegraf';
import { dbUpdateUserModel, dbUpdateUserTzOffset } from '../db/users.js';
import { MODELS } from '../const.js';

export async function handleStart(ctx) {
  const message = [
    'Привет! Это бот для работы с GPT. Используйте команды из главного меню:',
    '\n/choosemodel - для выбора модели.',
    '/settz - для установки часового пояса.',
    '/statistics - для просмотра статистики.',
    '\nВсе остальные сообщения отправляются в выбранную нейронку для получения ответа.',
  ];
  await ctx.reply(message.join('\n'));
}

export async function handleChooseModel(ctx) {
  const modelList = Object.keys(MODELS);
  const keyboard = Markup.inlineKeyboard(
    modelList.map((modelKey) => [Markup.button.callback(MODELS[modelKey].buttonText, `select_model:${modelKey}`)])
  );
  await ctx.reply('Выберите модель:', keyboard);
}

export async function handleSetTimezone(ctx) {
  const buttons = [];
  for (let i = -12; i <= 12; i++) {
    buttons.push(Markup.button.callback(`UTC${i >= 0 ? '+' : ''}${i}`, `set_tz:${i}`));
  }
  const keyboard = Markup.inlineKeyboard(buttons, { columns: 5 });
  await ctx.reply('Выберите ваш часовой пояс:', keyboard);
}

export async function handleModelSelection(ctx) {
  const modelKey = ctx.match[1];
  const tgId = ctx.from.id.toString();
  const success = await dbUpdateUserModel(tgId, modelKey);
  if (success) {
    await ctx.answerCbQuery(`Вы выбрали модель: ${modelKey}`);
    await ctx.editMessageText(`Текущая модель: ${MODELS[modelKey].buttonText}`);
  } else {
    await ctx.answerCbQuery('Произошла ошибка при обновлении модели');
  }
}

export async function handleTimezoneSelection(ctx) {
  const tzOffset = parseInt(ctx.match[1]);
  const tgId = ctx.from.id.toString();
  const success = await dbUpdateUserTzOffset(tgId, tzOffset);
  if (success) {
    await ctx.answerCbQuery(`Вы выбрали часовой пояс: UTC${tzOffset >= 0 ? '+' : ''}${tzOffset}`);
    await ctx.editMessageText(`Текущий часовой пояс: UTC${tzOffset >= 0 ? '+' : ''}${tzOffset}`);
  } else {
    await ctx.answerCbQuery('Произошла ошибка при обновлении часового пояса');
  }
}
