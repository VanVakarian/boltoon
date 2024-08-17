import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_TOKEN } from '../env.js';

const anthropic = new Anthropic({ apiKey: CLAUDE_TOKEN });

export async function getClaudeResponse(model, message) {
  const aiResponse = await anthropic.messages.create({
    model: model,
    messages: [{ role: 'user', content: message }],
    max_tokens: 1000,
  });

  return {
    answer: aiResponse.content[0].text,
    inputTokens: aiResponse.usage.input_tokens,
    outputTokens: aiResponse.usage.output_tokens,
  };
}
