import { Markup } from 'telegraf';
import { updateUserModel, updateUserTzOffset } from '../db/users.js';
import { MODELS, MODEL_LIST } from '../const.js';

export function getModelKeyboard() {
  return Markup.inlineKeyboard(
    MODEL_LIST.map((modelKey) => [Markup.button.callback(MODELS[modelKey].buttonText, `select_model:${modelKey}`)])
  );
}

export function getTimezoneKeyboard() {
  const buttons = [];
  for (let i = -12; i <= 12; i++) {
    buttons.push(Markup.button.callback(`UTC${i >= 0 ? '+' : ''}${i}`, `set_tz:${i}`));
  }
  return Markup.inlineKeyboard(buttons, { columns: 5 });
}

export async function handleChooseModel(ctx) {
  ctx.reply('Выберите модель:', getModelKeyboard());
}

export async function handleSetTimezone(ctx) {
  ctx.reply('Выберите ваш часовой пояс:', getTimezoneKeyboard());
}

export async function handleModelSelection(ctx) {
  const modelKey = ctx.match[1];
  const tgId = ctx.from.id.toString();
  const success = await updateUserModel(tgId, modelKey);
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
  const success = await updateUserTzOffset(tgId, tzOffset);
  if (success) {
    await ctx.answerCbQuery(`Вы выбрали часовой пояс: UTC${tzOffset >= 0 ? '+' : ''}${tzOffset}`);
    await ctx.editMessageText(`Текущий часовой пояс: UTC${tzOffset >= 0 ? '+' : ''}${tzOffset}`);
  } else {
    await ctx.answerCbQuery('Произошла ошибка при обновлении часового пояса');
  }
}
