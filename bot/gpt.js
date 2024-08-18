import { getChatGPTResponse } from '../gpt/chatgpt.js';
import { getClaudeResponse } from '../gpt/claude.js';
import { MODELS } from '../const.js';

export async function generateResponse(modelKey, fullMessage) {
  let response;
  if (MODELS[modelKey].modelName.startsWith('gpt')) {
    response = await getChatGPTResponse(MODELS[modelKey].modelName, fullMessage);
  } else if (MODELS[modelKey].modelName.startsWith('claude')) {
    response = await getClaudeResponse(MODELS[modelKey].modelName, fullMessage);
  } else {
    throw new Error('Unsupported model');
  }

  const { answer, inputTokens, outputTokens } = response;
  const inputCost = (inputTokens * MODELS[modelKey].prices.input) / 1000000;
  const outputCost = (outputTokens * MODELS[modelKey].prices.output) / 1000000;
  const totalCost = inputCost + outputCost;

  return {
    answer,
    totalCost: totalCost.toFixed(4),
  };
}
