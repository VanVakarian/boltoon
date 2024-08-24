import { Markup } from 'telegraf';
import { dbUpdateUserModel } from '../db/users.js';
import { dbGetUser } from '../db/users.js';
import { MODELS, DEFAULT_MODEL_KEY } from '../const.js';

export async function handleStart(ctx) {
  const message = [
    "👋 Привет! Это бот для работы с LLM'ками. Просто отправь сообщение и вам вернётся ответ из выбранной нейронки.",
    '',
    '✨ В данный момент доступны следующие модели, 🧠 (умные и дорогие) и 🚀 (быстрые и дешёвые):',
    '  ➤ ChatGPT 4o 🧠',
    '  ➤ ChatGPT 4o mini 🚀',
    '  ➤ Claude 3.5 Sonnet 🧠',
    '  ➤ Claude 3 Haiku 🚀',
    '',
    '💭 Каждое новое сообщение по умолчанию отправляется без предыдущих. Для того, чтобы включить определённое сообщение в следующий запрос (для сохранения контекста), просто ответь на него. Если таких сообщений несколько, то выдели их, скопируй и отправляй вместе с новым запросом.',
    '',
    '⚙️ Также доступны следующие команды из главного меню:',
    '👉 /choosemodel - для выбора модели;',
    '👉 /statistics - для просмотра статистики;',
  ];
  await ctx.reply(message.join('\n'));
}

export async function handleChooseModel(ctx) {
  const tgId = ctx.from.id;
  const user = await dbGetUser(tgId);
  const currentModelKey = user?.selected_model_key || DEFAULT_MODEL_KEY;
  const modelKeys = Object.keys(MODELS);
  const keyboard = Markup.inlineKeyboard(
    modelKeys.map((modelKey) => {
      const isSelected = modelKey === currentModelKey;
      const buttonText = isSelected ? `✅ ${MODELS[modelKey].buttonText} ✅` : MODELS[modelKey].buttonText;
      return [Markup.button.callback(buttonText, `select_model:${modelKey}`)];
    })
  );
  await ctx.reply('Выберите модель:', keyboard);
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
