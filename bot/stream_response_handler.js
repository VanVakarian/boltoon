import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CHATGPT_TOKEN, CLAUDE_TOKEN } from '../env.js';

const openai = new OpenAI({ apiKey: CHATGPT_TOKEN });
const anthropic = new Anthropic({ apiKey: CLAUDE_TOKEN });

export async function handleStreamResponse(ctx, model, message) {
  let initialResponse = await ctx.reply('⏳');
  let accumulatedResponse = '';
  let lastUpdateLength = 0;
  let usage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  let updateInterval = setInterval(async () => {
    if (accumulatedResponse.length > lastUpdateLength) {
      await updateTelegramMessage(ctx, initialResponse, accumulatedResponse, lastUpdateLength);
      lastUpdateLength = accumulatedResponse.length;
    }
  }, 1000); // Обновляем каждую секунду

  try {
    if (model.startsWith('gpt')) {
      const stream = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        stream: true,
        stream_options: {
          include_usage: true,
        },
      });

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0]?.delta?.content || '';
          accumulatedResponse += content;
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }
    } else if (model.startsWith('claude')) {
      const stream = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          usage.prompt_tokens = chunk.message.usage.input_tokens;
        } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          accumulatedResponse += chunk.delta.text;
        } else if (chunk.type === 'message_delta' && chunk.usage) {
          usage.completion_tokens += chunk.usage.output_tokens;
        }
      }
      usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;
    }
  } finally {
    clearInterval(updateInterval);
    await updateTelegramMessage(ctx, initialResponse, accumulatedResponse, lastUpdateLength);
  }

  return usage;
}

async function updateTelegramMessage(ctx, originalMessage, newContent, lastUpdateLength) {
  if (newContent.length === 0 || newContent.length <= lastUpdateLength) {
    return originalMessage;
  }

  const maxMessageLength = 4000; // 4096 actually, but leaving some wiggle room
  let currentMessage = originalMessage;

  try {
    if (newContent.length <= maxMessageLength) {
      await ctx.telegram.editMessageText(currentMessage.chat.id, currentMessage.message_id, null, newContent);
    } else {
      const firstPart = newContent.slice(0, maxMessageLength - 3) + '...';
      await ctx.telegram.editMessageText(currentMessage.chat.id, currentMessage.message_id, null, firstPart);

      let remainingContent = '...' + newContent.slice(maxMessageLength - 3);
      while (remainingContent.length > 0) {
        currentMessage = await sendNewMessage(ctx, currentMessage.chat.id, remainingContent.slice(0, maxMessageLength));
        remainingContent = remainingContent.slice(maxMessageLength);
      }
    }
  } catch (error) {
    handleTelegramError(error);
  }

  return currentMessage;
}

async function sendNewMessage(ctx, chatId, content) {
  try {
    return await ctx.telegram.sendMessage(chatId, content);
  } catch (error) {
    console.error('Error sending new message:', error);
    throw error;
  }
}

function handleTelegramError(error) {
  if (
    error.description ===
    'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message'
  ) {
    console.warn('Message content unchanged, skipping update');
  } else if (error.description && error.description.startsWith('Bad Request: message to edit not found')) {
    console.error('Message to edit not found, possibly deleted');
  } else {
    console.error('Error updating message:', error);
  }
}
