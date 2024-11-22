import { MODELS, DEFAULT_MODEL_KEY } from '../const.js';
import { escapeHTML, logMessageToFile } from '../utils.js';
import { dbGetUser, dbGetAdminUsers } from '../db/users.js';
import { dbStoreCost } from '../db/token_history.js';
import { handleStreamResponse } from './stream_response_handler.js';

export async function handleTextMessage(ctx) {
  const tgId = ctx.message.from.id;
  const userMessage = ctx.message.text;
  let user, selectedModelKey;

  try {
    user = await dbGetUser(tgId);
    if (!user) {
      await logMessageToFile(ctx.message);
      return;
    }

    selectedModelKey = user.selected_model_key;
    if (!selectedModelKey || !MODELS[selectedModelKey]) {
      selectedModelKey = DEFAULT_MODEL_KEY;
    }

    await ctx.sendChatAction('typing');
    const quote = ctx.message.reply_to_message?.text;
    const fullMessage = quote ? `${quote}\n\n${userMessage}` : userMessage;

    const model = MODELS[selectedModelKey];
    const usage = await handleStreamResponse(ctx, model.modelName, fullMessage);

    const requestTs = ctx.message.date;
    const totalCost = calculateCost(usage, model);
    await dbStoreCost(user.id, requestTs, totalCost);
  } catch (error) {
    console.error('Error in handleTextMessage:', error);
    let errorMessage = 'Произошла ошибка при обработке вашего сообщения.';

    if (error.message === 'User not found') {
      errorMessage = 'Ваш пользовательский профиль не найден. Пожалуйста, свяжитесь с администратором.';
    } else if (error.message === 'Connection error' || error.message.includes('Connection error')) {
      errorMessage = 'Проблема с подключением к серверу ИИ. Пожалуйста, подождите немного и повторите запрос.';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Не удалось установить соединение с сервером. Пожалуйста, попробуйте позже.';
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'Превышен лимит запросов. Пожалуйста, попробуйте позже.';
    }

    await ctx.reply(errorMessage);
    await sendErrorToAdmin(ctx, error);
  }
}

function calculateCost(usage, model) {
  if (!usage) {
    console.warn('Usage information is missing');
    return 0;
  }
  const inputCost = (usage.prompt_tokens * model.prices.input) / 1000000;
  const outputCost = (usage.completion_tokens * model.prices.output) / 1000000;
  return inputCost + outputCost;
}

async function sendErrorToAdmin(ctx, error) {
  const adminUsers = await dbGetAdminUsers();
  const errorMessage = `❗️Ошибка в боте:\n\nПользователь: ${ctx.from.id}\nСообщение: ${
    ctx.message.text
  }\n\n<pre><code>${escapeHTML(String(error.stack))}</code></pre>`;

  for (const admin of adminUsers) {
    try {
      await ctx.telegram.sendMessage(admin.tg_id, errorMessage, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error(`Не удалось отправить сообщение об ошибке админу ${admin.tg_id}:`, sendError);
    }
  }
}
