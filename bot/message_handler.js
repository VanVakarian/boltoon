import { MODELS, DEFAULT_MODEL_KEY } from '../const.js';
import { escapeHTML } from '../utils.js';
import { dbGetUser, dbGetAdminUsers } from '../db/users.js';
import { dbStoreCost } from '../db/token_history.js';
import { handleStreamResponse } from './stream_response_handler.js';

export async function handleTextMessage(ctx) {
  const tgId = ctx.message.from.id;
  const userMessage = ctx.message.text;
  const user = await dbGetUser(tgId);
  let selectedModelKey = user?.selected_model_key;

  if (!selectedModelKey || !MODELS[selectedModelKey]) selectedModelKey = DEFAULT_MODEL_KEY;

  if (!user.is_activated) return;

  try {
    await ctx.sendChatAction('typing');
    const quote = ctx.message.reply_to_message?.text;
    const fullMessage = quote ? `${quote}\n\n${userMessage}` : userMessage;

    const model = MODELS[selectedModelKey];
    const usage = await handleStreamResponse(ctx, model.modelName, fullMessage);

    const requestTs = ctx.message.date;
    const totalCost = calculateCost(usage, model);
    await dbStoreCost(user.id, requestTs, totalCost);

    // Финальное обновление теперь происходит в handleStreamResponse
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply(`Произошла ошибка:\n${error}.\nОтчёт уже отправлен Владу.`);
    await sendErrorToAdmin(ctx, error);
  }
}

function calculateCost(usage, model) {
  if (!usage) {
    console.error('Usage information is missing');
    return 0;
  }
  const inputCost = (usage.prompt_tokens * model.prices.input) / 1000000;
  const outputCost = (usage.completion_tokens * model.prices.output) / 1000000;
  return inputCost + outputCost;
}

async function sendErrorToAdmin(ctx, error) {
  const adminUsers = await dbGetAdminUsers();
  const errorMessage = `❗️Ошибка в боте:\n\n<pre><code>${escapeHTML(String(error.stack))}</code></pre>`;

  for (const admin of adminUsers) {
    try {
      await ctx.telegram.sendMessage(admin.tg_id, errorMessage, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error(`Не удалось отправить сообщение об ошибке админу ${admin.tg_id}:`, sendError);
    }
  }
}
