import OpenAI from 'openai';
import { CHATGPT_TOKEN } from '../env.js';

const openai = new OpenAI({ apiKey: CHATGPT_TOKEN });

export async function getChatGPTResponse(model, message) {
  const aiResponse = await openai.chat.completions.create({
    messages: [{ role: 'user', content: message }],
    model: model,
  });

  return {
    answer: aiResponse.choices[0].message.content,
    inputTokens: aiResponse.usage.prompt_tokens,
    outputTokens: aiResponse.usage.completion_tokens,
  };
}
