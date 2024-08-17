import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import OpenAI from 'openai';

import { initDatabase } from './db/init.js';
import { getUser, createUser, updateUserModel } from './db/users.js';

import { escapeHTML } from './utils.js';

import { TG_BOT_TOKEN, OPENAI_TOKEN } from './env.js';
import { MODEL_PRICES, MODELS, DEFAULT_MODEL } from './const.js';

await initDatabase();

const bot = new Telegraf(TG_BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_TOKEN });

function getModelKeyboard() {
  return Markup.inlineKeyboard(MODELS.map((model) => [Markup.button.callback(model, `select_model:${model}`)]));
}

bot.command('start', (ctx) => {
  ctx.reply('Добро пожаловать! Используйте /choosemodel для настройки модели.');
});

bot.command('choosemodel', (ctx) => {
  ctx.reply('Выберите модель:', getModelKeyboard());
});

bot.action(/^select_model:(.+)$/, async (ctx) => {
  const model = ctx.match[1];
  const tgId = ctx.from.id.toString();
  const success = await updateUserModel(tgId, model);
  if (success) {
    await ctx.answerCbQuery(`Вы выбрали модель: ${model}`);
    await ctx.editMessageText(`Текущая модель: ${model}`);
  } else {
    await ctx.answerCbQuery('Произошла ошибка при обновлении модели');
  }
});

bot.on(message('text'), async (ctx) => {
  // console.log('\nctx:', ctx.update);
  const tgId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const user = await getUser(tgId);
  // console.log('\nUser:', user);
  const selectedModel = user.selected_model;

  if (!user.is_activated) return;

  // if (!user) {
  //   await createUser(tgId, ctx.chat?.username, ctx.chat?.first_name, ctx.chat?.last_name, DEFAULT_MODEL);
  //   user = { selected_model: DEFAULT_MODEL };
  // }

  try {
    await ctx.sendChatAction('typing');

    const quote = ctx.message.reply_to_message?.text;
    const fullMessage = quote ? `${quote}\n\n${userMessage}` : userMessage;

    const aiResponse = await openai.chat.completions.create({
      messages: [
        // { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: fullMessage },
      ],
      model: selectedModel,
    });
    console.log('\nCompletion:', aiResponse);

    const answer = aiResponse.choices[0].message.content;
    // console.log('OpenAI response:', answer);

    const inputTokens = aiResponse.usage.prompt_tokens;
    const outputTokens = aiResponse.usage.completion_tokens;
    const inputCost = (inputTokens * MODEL_PRICES[selectedModel].input) / 1000;
    const outputCost = (outputTokens * MODEL_PRICES[selectedModel].output) / 1000;
    const totalCost = inputCost + outputCost;

    console.log(`Стоимость запроса: $${totalCost.toFixed(4)}`);

    const reply = `${answer}\n\nСтоимость этого запроса: $${totalCost.toFixed(4)}`;
    await ctx.reply(reply);
  } catch (error) {
    console.error('Error:', error);
    await ctx.replyWithHTML(
      [
        '❗️Ошибка 404: Программы, написанной без багов не найдено!   (´•︵•`)',
        'Пожалуйста, перешлите рукожопому программисту это сообщение с причиной ошибки:',
        `\n<pre><code>${escapeHTML(String(error.stack))}</code></pre>`,
      ].join('\n')
    );
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
