import { MODELS, DEFAULT_MODEL_KEY } from '../const.js';
import { escapeHTML } from '../utils.js';
import { dbGetUser, dbGetAdminUsers } from '../db/users.js';
import { dbStoreCost } from '../db/token_history.js';
import { getChatGPTResponse } from '../gpt/chatgpt.js';
import { getClaudeResponse } from '../gpt/claude.js';

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
    const { answer, totalCost } = await generateResponse(model, fullMessage);

    const requestTs = ctx.message.date;
    await dbStoreCost(user.id, requestTs, totalCost);

    await ctx.reply(answer);
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply(`Произошла ошибка:\n${error}.\nОтчёт уже отправлен Владу.`);
    await sendErrorToAdmin(error);
  }
}

async function generateResponse(model, fullMessage) {
  let response;
  if (model.modelName.startsWith('gpt')) {
    response = await getChatGPTResponse(model.modelName, fullMessage);
  } else if (model.modelName.startsWith('claude')) {
    response = await getClaudeResponse(model.modelName, fullMessage);
  } else {
    throw new Error('Unsupported model');
  }

  const { answer, inputTokens, outputTokens } = response;

  const inputCost = (inputTokens * model.prices.input) / 1000000;
  const outputCost = (outputTokens * model.prices.output) / 1000000;
  const totalCost = inputCost + outputCost;

  return { answer, totalCost };
}

async function sendErrorToAdmin(error) {
  const adminUsers = await dbGetAdminUsers();
  const errorMessage = `❗️Ошибка в боте:\n\n<pre><code>${escapeHTML(String(error.stack))}</code></pre>`;

  for (const admin of adminUsers) {
    try {
      await bot.telegram.sendMessage(admin.tg_id, errorMessage, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error(`Не удалось отправить сообщение об ошибке админу ${admin.tg_id}:`, sendError);
    }
  }
}
